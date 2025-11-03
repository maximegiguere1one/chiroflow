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

    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, owner_id, full_name')
      .ilike('phone', `%${phoneNumber}%`)
      .single();

    if (contactError || !contact) {
      console.error('Contact not found for phone:', phoneNumber);
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        {
          headers: { 'Content-Type': 'text/xml' },
          status: 200,
        }
      );
    }

    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_id', contact.id)
      .eq('status', 'active')
      .eq('channel', 'sms')
      .single();

    let conversationId = existingConv?.id;

    if (!conversationId) {
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
    } else {
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: body.substring(0, 100),
          unread_count: supabase.rpc('increment', { conversation_id: conversationId }),
        })
        .eq('id', conversationId);
    }

    const { error: messageError } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        contact_id: contact.id,
        channel: 'sms',
        direction: 'inbound',
        from_address: from,
        to_address: to,
        body: body,
        status: 'received',
        owner_id: contact.owner_id,
        metadata: {
          twilio_sid: messageSid,
          twilio_account_sid: accountSid,
        },
      });

    if (messageError) {
      console.error('Error saving message:', messageError);
    }

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