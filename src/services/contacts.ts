import { supabase } from '@/plugins/supabase';
import { ref } from 'vue';
import type { Contact, ContactResponse } from '@/types/types';

export const contacts = ref<Contact[]>([]);
export const loading = ref(true);

function capitalize(str: string): string {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function getInitials(firstName: string, lastName: string): string {
  const firstInitial = firstName?.[0]?.toUpperCase() || '';
  const lastInitial = lastName?.[0]?.toUpperCase() || '';
  return `${firstInitial}${lastInitial}`;
}

export async function fetchContacts(userId: string): Promise<{ contacts: Contact[], rawContacts: ContactResponse[] }> {
  if (!userId) {
    console.error('No user ID available');
    return { contacts: [], rawContacts: [] };
  }

  try {
    const { data, error } = await supabase
      .from('user_contacts')
      .select(`
        contact_id,
        contact:users!user_contacts_contact_id_fkey (
          id,
          first_name,
          last_name,
          username
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contacts:', error);
      return { contacts: [], rawContacts: [] };
    }

    if (data) {
      const typedData = data as unknown as ContactResponse[];
      const contacts = typedData.map(row => ({
        id: row.contact.id,
        first_name: capitalize(row.contact.first_name),
        last_name: capitalize(row.contact.last_name),
        username: row.contact.username,
        initials: getInitials(row.contact.first_name, row.contact.last_name)
      }));
      return { contacts, rawContacts: typedData };
    }

    return { contacts: [], rawContacts: [] };
  } catch (error) {
    console.error('Unexpected error fetching contacts:', error);
    return { contacts: [], rawContacts: [] };
  }
}

export async function removeContact(userId: string, contactId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const { error } = await supabase
      .from('user_contacts')
      .delete()
      .eq('user_id', userId)
      .eq('contact_id', contactId);

    if (error) {
      console.error('Error removing contact:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error removing contact:', error);
    return false;
  }
}