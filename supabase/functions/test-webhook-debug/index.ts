import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const formData = await req.formData();
  const from = '+14185728464';
  const to = '+14314457272';
  const body = 'DEBUG TEST - Message de verification';
  const messageSid = 'SM_debug_' + Date.now();

  console.log('=== DEBUG START ===');
  console.log('From:', from);
  console.log('To:', to);
  console.log('Body:', body);

  const phoneNumber = from.replace(/\D/g, '');
  console.log('Phone number cleaned:', phoneNumber);

  const { data: contacts, error: contactError } = await supabase
    .from('contacts')
    .select('id, owner_id, full_name, phone')
    .ilike('phone', `%${phoneNumber}%`)
    .limit(10);

  console.log('Contacts found:', contacts?.length);
  console.log('Contact error:', contactError);
  console.log('Contacts data:', JSON.stringify(contacts));

  if (!contacts || contacts.length === 0) {
    return new Response(JSON.stringify({
      error: 'No contact found',
      phoneNumber,
      searchPattern: `%${phoneNumber}%`,
      allContacts: contacts
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const contact = contacts[0];
  console.log('Using contact:', contact.id);

  const { data: conv } = await supabase
    .from('conversations')
    .select('id')
    .eq('contact_id', contact.id)
    .eq('channel', 'sms')
    .maybeSingle();

  console.log('Conversation:', conv?.id);

  let conversationId = conv?.id;

  if (!conversationId) {
    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({
        contact_id: contact.id,
        owner_id: contact.owner_id,
        subject: `SMS Debug ${contact.full_name}`,
        status: 'active',
        channel: 'sms',
        last_message_at: new Date().toISOString(),
        last_message_preview: body,
        unread_count: 1,
      })
      .select()
      .single();

    if (convError) {
      console.error('Conv error:', convError);
      return new Response(JSON.stringify({ error: 'Conversation error', details: convError }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    conversationId = newConv.id;
    console.log('Created conversation:', conversationId);
  }

  const { data: msg, error: msgError } = await supabase
    .from('conversation_messages')
    .insert({
      conversation_id: conversationId,
      contact_id: contact.id,
      channel: 'sms',
      direction: 'inbound',
      from_address: from,
      to_address: to,
      body: body,
      status: 'delivered',
      owner_id: contact.owner_id,
      metadata: { twilio_sid: messageSid, debug: true },
    })
    .select()
    .single();

  if (msgError) {
    console.error('Message error:', msgError);
    return new Response(JSON.stringify({ error: 'Message error', details: msgError }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log('Message created:', msg.id);
  console.log('=== DEBUG END ===');

  return new Response(JSON.stringify({
    success: true,
    messageId: msg.id,
    conversationId,
    contactId: contact.id,
    contactName: contact.full_name
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
