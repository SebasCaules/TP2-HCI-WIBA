import { ref } from 'vue';
import type { Contact } from '@/types/types';

export const contacts = ref<Contact[]>([]);
export const loading = ref(false);

interface StoredContact {
    firstName: string;
    lastName: string;
    type: 'cvu' | 'alias';
    addedAt: string;
}

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

function getStorageKey(userId: string): string {
  return `contacts_${userId}`;
}

function isCvu(identifier: string): boolean {
  // CVU format: 20 characters, only uppercase letters (except I) and numbers
  const cvuRegex = /^[A-HJ-Z0-9]{20}$/;
  return cvuRegex.test(identifier);
}

function isAlias(identifier: string): boolean {
  // Alias format: three uppercase words separated by dots
  const aliasRegex = /^[A-Z]+\.[A-Z]+\.[A-Z]+$/;
  return aliasRegex.test(identifier);
}

function getContactType(identifier: string): 'cvu' | 'alias' {
  if (isCvu(identifier)) return 'cvu';
  if (isAlias(identifier)) return 'alias';
  throw new Error('Invalid identifier format. Must be either a CVU (20 alphanumeric characters) or an alias (WORD.WORD.WORD)');
}

// New function to validate contact addition
async function validateContactAddition(
    userId: string,
    contactId: string,
    firstName: string,
    lastName: string,
    userCvu?: string,
    userAlias?: string
): Promise<{ isValid: boolean; error?: string }> {
    if (!userId || !contactId) {
        return { isValid: false, error: 'Invalid user or contact ID' };
    }

    // Check if trying to add self
    if (userCvu && contactId === userCvu) {
        return { isValid: false, error: 'No podes agregarte a vos mismo como contacto' };
    }
    if (userAlias && contactId === userAlias) {
        return { isValid: false, error: 'No podes agregarte a vos mismo como contacto' };
    }

    try {
        const storedContacts = localStorage.getItem(getStorageKey(userId));
        const contactsMap = storedContacts ? JSON.parse(storedContacts) : {};

        // Check if contact already exists by ID
        if (contactsMap[contactId]) {
            return { isValid: false, error: 'Este contacto ya existe en tu lista' };
        }

        return { isValid: true };
    } catch (error) {
        console.error('Error validating contact:', error);
        return { isValid: false, error: 'Error al validar el contacto' };
    }
}

export async function fetchContacts(userId: string): Promise<{ contacts: Contact[] }> {
  if (!userId) {
    console.error('No user ID available');
    return { contacts: [] };
  }

  loading.value = true;
  try {
    const storedContacts = localStorage.getItem(getStorageKey(userId));
    const contactsMap = storedContacts ? JSON.parse(storedContacts) : {};
    
    // Convert the map to an array of Contact objects
    const contacts = Object.entries(contactsMap).map(([identifier, data]) => {
      const contactData = data as StoredContact;
      return {
        id: identifier,
        first_name: capitalize(contactData.firstName),
        last_name: capitalize(contactData.lastName),
        username: identifier,
        initials: getInitials(contactData.firstName, contactData.lastName),
        account_number: contactData.type === 'cvu' ? identifier : undefined,
        type: contactData.type,
        addedAt: contactData.addedAt
      };
    });

    // Sort contacts by addedAt (most recent first)
    contacts.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());

    return { contacts };
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return { contacts: [] };
  } finally {
    loading.value = false;
  }
}

export async function removeContact(userId: string, contactId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const storedContacts = localStorage.getItem(getStorageKey(userId));
    if (!storedContacts) return false;

    const contactsMap = JSON.parse(storedContacts);
    delete contactsMap[contactId];
    
    localStorage.setItem(getStorageKey(userId), JSON.stringify(contactsMap));
    return true;
  } catch (error) {
    console.error('Error removing contact:', error);
    return false;
  }
}

export async function addContact(
    userId: string,
    contactId: string,
    firstName: string,
    lastName: string,
    userCvu?: string,
    userAlias?: string
): Promise<{ success: boolean; error?: string }> {
    if (!userId || !contactId) {
        return { success: false, error: 'Invalid user or contact ID' };
    }

    try {
        // Validate contact addition
        const validation = await validateContactAddition(userId, contactId, firstName, lastName, userCvu, userAlias);
        if (!validation.isValid) {
            return { success: false, error: validation.error };
        }

        const storedContacts = localStorage.getItem(getStorageKey(userId));
        const contactsMap = storedContacts ? JSON.parse(storedContacts) : {};

        // Create new contact entry
        const newContact: StoredContact = {
            firstName,
            lastName,
            type: getContactType(contactId),
            addedAt: new Date().toISOString()
        };

        // Add to map and save
        contactsMap[contactId] = newContact;
        localStorage.setItem(getStorageKey(userId), JSON.stringify(contactsMap));
        return { success: true };
    } catch (error) {
        console.error('Error adding contact:', error);
        return { success: false, error: 'Error al agregar el contacto' };
    }
}