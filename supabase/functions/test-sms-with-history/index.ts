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

    const { contactId, message } = await req.json();

    if (!contactId || !message) {
      throw new Error('Missing contactId or message');
    }

    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, owner_id, full_name, phone')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      throw new Error('Contact not found');
    }

    const { data: settingsArray } = await supabase
      .from('clinic_settings')
      .select('twilio_account_sid, twilio_auth_token, twilio_phone_number')
      .eq('owner_id', contact.owner_id)
      .limit(1);

    const settings = settingsArray?.[0];

    if (!settings?.twilio_account_sid || !settings?.twilio_auth_token || !settings?.twilio_phone_number) {
      throw new Error('Twilio settings not configured');
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${settings.twilio_account_sid}/Messages.json`;
    const auth = btoa(`${settings.twilio_account_sid}:${settings.twilio_auth_token}`);

    const formattedPhone = contact.phone.replace(/\D/g, '').startsWith('1')
      ? `+${contact.phone.replace(/\D/g, '')}`
      : `+1${contact.phone.replace(/\D/g, '')}`;

    const formData = new URLSearchParams();
    formData.append('To', formattedPhone);
    formData.append('From', settings.twilio_phone_number);
    formData.append('Body', message);

    console.log('Sending SMS to:', formattedPhone);

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      throw new Error(`Twilio error: ${twilioData.message || 'Unknown error'}`);
    }

    console.log('SMS sent, Twilio SID:', twilioData.sid);

    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_id', contact.id)
      .eq('owner_id', contact.owner_id)
      .eq('status', 'active')
      .eq('channel', 'sms')
      .maybeSingle();

    let conversationId = existingConv?.id;

    if (!conversationId) {
      console.log('Creating new SMS conversation');
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          contact_id: contact.id,
          owner_id: contact.owner_id,
          subject: `SMS avec ${contact.full_name}`,
          status: 'active',
          channel: 'sms',
          last_message_at: new Date().toISOString(),
          last_message_preview: message.substring(0, 100),
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        throw new Error(`Failed to create conversation: ${convError.message}`);
      }

      conversationId = newConv.id;
      console.log('Conversation created:', conversationId);
    } else {
      console.log('Using existing conversation:', conversationId);
    }

    const { data: messageData, error: messageError } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        contact_id: contact.id,
        channel: 'sms',
        direction: 'outbound',
        from_address: settings.twilio_phone_number,
        to_address: formattedPhone,
        body: message,
        status: twilioData.status,
        owner_id: contact.owner_id,
        metadata: {
          twilio_sid: twilioData.sid,
          twilio_status: twilioData.status,
          test: true,
        },
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error saving message:', messageError);
      throw new Error(`Failed to save message: ${messageError.message}`);
    }

    console.log('Message saved:', messageData.id);

    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: message.substring(0, 100),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    console.log('Conversation updated');

    return new Response(
      JSON.stringify({
        success: true,
        twilioSid: twilioData.sid,
        conversationId: conversationId,
        messageId: messageData.id,
        twilioStatus: twilioData.status,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
