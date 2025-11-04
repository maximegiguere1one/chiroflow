import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const formData = await req.formData();
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const body = formData.get('Body') as string;
    const messageSid = formData.get('MessageSid') as string;
    const accountSid = formData.get('AccountSid') as string;

    console.log('Received SMS from Twilio:', { from, to, body, messageSid });

    const phoneNumber = from.replace(/\D/g, '');
    console.log('Looking for contact with phone:', phoneNumber);

    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .select('id, owner_id, full_name')
      .ilike('phone', `%${phoneNumber}%`)
      .limit(1);

    const contact = contacts?.[0];

    if (contactError || !contact) {
      console.error('Contact not found for phone:', phoneNumber, contactError);
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        {
          headers: { 'Content-Type': 'text/xml' },
          status: 200,
        }
      );
    }

    console.log('Contact found:', contact.id, contact.full_name);

    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id, unread_count')
      .eq('contact_id', contact.id)
      .eq('status', 'active')
      .eq('channel', 'sms')
      .maybeSingle();

    let conversationId = existingConv?.id;

    if (!conversationId) {
      console.log('Creating new SMS conversation for contact:', contact.id);
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          contact_id: contact.id,
          owner_id: contact.owner_id,
          subject: `SMS avec ${contact.full_name}`,
          status: 'active',
          channel: 'sms',
          last_message_at: new Date().toISOString(),
          last_message_preview: body.substring(0, 100),
          unread_count: 1,
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        throw new Error('Failed to create conversation');
      }

      conversationId = newConv.id;
      console.log('New conversation created:', conversationId);
    } else {
      console.log('Updating existing conversation:', conversationId);
      const currentUnread = existingConv.unread_count || 0;
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: body.substring(0, 100),
          unread_count: currentUnread + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);
    }

    console.log('Saving message to conversation:', conversationId);

    const { error: messageError } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        contact_id: contact.id,
        twilio_message_sid: messageSid,
        channel: 'sms',
        direction: 'inbound',
        from_address: from,
        to_address: to,
        body: body,
        status: 'delivered',
        sent_at: new Date().toISOString(),
        delivered_at: new Date().toISOString(),
        owner_id: contact.owner_id,
        metadata: {
          twilio_sid: messageSid,
          twilio_account_sid: accountSid,
        },
      });

    if (messageError) {
      console.error('Error saving message:', messageError);
      throw new Error('Failed to save message');
    }

    console.log('Message saved successfully. Twilio SID:', messageSid);

    await supabase
      .from('email_tracking')
      .insert({
        contact_id: contact.id,
        recipient_phone: from,
        recipient_email: `sms-${contact.id}@placeholder.com`,
        email_type: 'sms_inbound',
        subject: `SMS reçu de ${contact.full_name}`,
        body: body,
        template_name: 'inbound_sms',
        channel: 'sms',
        status: 'received',
        direction: 'inbound',
        sent_at: new Date().toISOString(),
        delivered_at: new Date().toISOString(),
        owner_id: contact.owner_id,
        metadata: {
          twilio_sid: messageSid,
          conversation_id: conversationId,
        },
      });

    console.log('Message also saved to email_tracking for unified view');

    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        headers: { 'Content-Type': 'text/xml' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in receive-sms-twilio:', error);
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        headers: { 'Content-Type': 'text/xml' },
        status: 200,
      }
    );
  }
});
