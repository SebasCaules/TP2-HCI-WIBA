<template>
    <v-container class="transfer-container" fluid>
        <BackButton to="/dashboard" class="back-btn-top-left" />
        <div class="transfer-content">
            <h1 class="transfer-title">Transferir</h1>
            <div class="transfer-form-group">
                <CustomTextField
                    v-model="recipient"
                    placeholder="Email, CVU o alias"
                    class="transfer-recipient-input"
                >
                    <template #right>
                        <v-btn
                            icon
                            class="recipient-contact-btn"
                            @click="showContactDialog = true"
                            style="margin-right: -0.6rem"
                        >
                            <v-icon>mdi-account-multiple</v-icon>
                        </v-btn>
                    </template>
                </CustomTextField>
            </div>
            <div class="transfer-form-group">
                <CustomTextField
                    v-model="amount"
                    type="number"
                    placeholder="Monto"
                    class="transfer-amount-input"
                    @input="handleAmountInput"
                />
            </div>
            <div class="transfer-form-group">
                <CustomTextField
                    v-model="reason"
                    placeholder="Descripción"
                    class="transfer-reason-input"
                />
            </div>
            <div class="transfer-form-group">
                <button type="button" class="deposit-method-box" @click="showPaymentMethodDialog = true">
                    <template v-if="selectedPaymentMethod === 'account'">
                        <v-icon color="primary" class="deposit-method-icon">mdi-wallet</v-icon>
                        <span class="deposit-method-text">
                            <b>Saldo de la cuenta</b>
                        </span>
                    </template>
                    <template v-else-if="selectedCard">
                        <img :src="selectedCard?.logo" :alt="selectedCard?.brand" class="deposit-card-logo" />
                        <span class="deposit-method-text">
                            <b>{{ selectedCard.brand }}</b> *{{ selectedCard.number_last4 }}
                        </span>
                    </template>
                    <template v-else>
                        <span class="deposit-method-text">
                            Selecciona un método de pago
                        </span>
                    </template>
                    <v-icon class="deposit-select-icon">mdi-chevron-right</v-icon>
                </button>
            </div>
            <FilledButton
                class="transfer-continue-btn"
                @click="handleTransfer"
                :disabled="!isTransferValid"
            >
                Continuar
            </FilledButton>
            <div v-if="errorMessage" class="transfer-error-message">
                {{ errorMessage }}
            </div>
        </div>

        <!-- Contact Picker Dialog -->
        <v-dialog
            v-model="showContactDialog"
            max-width="960px"
            :retain-focus="false"
            :scrim="true"
            style="border-radius: 1.5rem"
        >
            <v-card class="select-contact-dialog">
                <div class="select-contact-dialog-header">
                    <span class="select-contact-title"
                        >Seleccionar contacto</span
                    >
                    <v-btn
                        icon
                        class="dialog-close-btn"
                        @click="showContactDialog = false"
                    >
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </div>
                <div class="select-contact-list-custom">
                    <template v-if="contacts.length > 0">
                        <div
                            v-for="contact in contacts"
                            :key="contact.id"
                            class="select-contact-custom"
                        >
                            <div
                                class="select-contact-info"
                                @click="selectContact(contact)"
                            >
                                <div class="select-contact-name">
                                    {{ contact.first_name }} {{ contact.last_name }}
                                </div>
                                <div class="select-contact-detail">
                                    {{ contact.username }}
                                </div>
                            </div>
                            <v-btn
                                icon
                                color="error"
                                variant="text"
                                class="remove-contact-btn"
                                @click="removeContact(contact.id)"
                            >
                                <v-icon>mdi-delete</v-icon>
                            </v-btn>
                        </div>
                    </template>
                    <div v-else class="no-contacts-message">
                        <v-icon size="48" color="primary"
                            >mdi-account-multiple</v-icon
                        >
                        <div class="no-contacts-title">
                            No tienes contactos guardados
                        </div>
                        <div class="no-contacts-subtitle">
                            Agrega contactos para transferir más rápido
                        </div>
                    </div>
                </div>
                <div
                    class="select-contact-actions"
                    style="
                        display: flex;
                        justify-content: center;
                        margin-top: 1.5rem;
                    "
                >
                    <FilledButton @click="showAddContactDialog = true">
                        Agregar contacto
                    </FilledButton>
                </div>
            </v-card>
        </v-dialog>
        <AddContactDialog
            v-model="showAddContactDialog"
            @contact-added="fetchContacts"
        />

        <!-- Transfer Confirmation Dialog -->
        <v-dialog
            v-model="showConfirmDialog"
            width="650"
            :retain-focus="false"
            :scrim="true"
        >
            <v-card class="confirm-transfer-dialog" width="100%">
                <div class="confirm-transfer-header">
                    <span class="confirm-transfer-title"
                        >Confirmar transferencia</span
                    >
                    <v-btn
                        icon
                        class="dialog-close-btn"
                        @click="showConfirmDialog = false"
                    >
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </div>
                <div class="confirm-transfer-content">
                    <div class="confirm-transfer-table">
                        <div class="confirm-transfer-row">
                            <span class="confirm-transfer-label"
                                >Destinatario:</span
                            >
                            <span class="confirm-transfer-value"
                                >{{ recipientFirstName }}
                                {{ recipientLastName }}</span
                            >
                        </div>
                        <div class="confirm-transfer-row">
                            <span class="confirm-transfer-label">Monto:</span>
                            <span class="confirm-transfer-value"
                                >${{ formatNumber(amount) }}</span
                            >
                        </div>
                        <div class="confirm-transfer-row" v-if="reason">
                            <span class="confirm-transfer-label">Motivo:</span>
                            <span class="confirm-transfer-value">{{
                                reason
                            }}</span>
                        </div>
                    </div>
                    <div class="confirm-transfer-actions">
                        <FilledButton
                            class="confirm-transfer-btn"
                            @click="confirmTransfer"
                        >
                            Confirmar
                        </FilledButton>
                    </div>
                </div>
            </v-card>
        </v-dialog>

        <!-- Success Dialog -->
        <v-dialog v-model="showSuccessDialog" max-width="400px">
            <v-card class="success-dialog">
                <div class="success-dialog-header">
                    <v-btn
                        icon
                        class="dialog-close-btn"
                        @click="showSuccessDialog = false"
                    >
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </div>
                <div class="success-dialog-content">
                    <v-icon color="success" size="48">mdi-check-circle</v-icon>
                    <div class="success-dialog-title">
                        ¡Transferencia realizada con éxito!
                    </div>
                    <div class="success-dialog-message">
                        La transferencia fue completada correctamente.
                    </div>
                </div>
            </v-card>
        </v-dialog>

        <!-- Error Dialog -->
        <v-dialog v-model="showErrorDialog" max-width="400px">
            <v-card class="error-dialog">
                <div class="error-dialog-header">
                    <v-btn
                        icon
                        class="dialog-close-btn"
                        @click="showErrorDialog = false"
                    >
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </div>
                <div class="error-dialog-content">
                    <v-icon color="error" size="48">mdi-alert-circle</v-icon>
                    <div class="error-dialog-title">
                        Error en la transferencia
                    </div>
                    <div class="error-dialog-message">
                        {{ errorDialogMessage }}
                    </div>
                </div>
            </v-card>
        </v-dialog>

        <!-- Add Payment Method Dialog -->
        <v-dialog 
            v-model="showPaymentMethodDialog" 
            max-width="960px" 
            :retain-focus="false"
            :scrim="true"
        >
            <v-card class="select-card-dialog">
                <div class="select-card-dialog-header">
                    <span class="select-card-title">Seleccionar método de pago</span>
                    <v-btn icon class="dialog-close-btn" @click="showPaymentMethodDialog = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </div>
                <div class="select-card-list-custom">
                    <!-- Account Balance Option -->
                    <div
                        class="select-card-custom"
                        :class="{ selected: selectedPaymentMethod === 'account' }"
                        @click="selectPaymentMethod('account')"
                    >
                        <v-icon color="primary" size="32" class="select-card-icon">mdi-wallet</v-icon>
                        <div class="select-card-info">
                            <div class="select-card-brand">Saldo de la cuenta</div>
                            <div class="select-card-balance">Saldo disponible: ${{ formatNumber(accountBalance.toString()) }}</div>
                        </div>
                        <v-icon v-if="selectedPaymentMethod === 'account'" color="primary" class="select-card-check">mdi-check-circle</v-icon>
                    </div>
                    <!-- Cards -->
                    <template v-if="cards.length > 0">
                        <div
                            v-for="card in cards"
                            :key="card.id"
                            class="select-card-custom"
                            :class="{ selected: selectedCard && selectedCard.id === card.id }"
                            @click="selectCard(card)"
                        >
                            <img :src="card.logo" :alt="card.brand" class="select-card-logo" />
                            <div class="select-card-info">
                                <div class="select-card-brand">{{ card.brand }} *{{ card.number_last4 }}</div>
                                <div class="select-card-expiry">Vence {{ card.expiry }}</div>
                            </div>
                            <v-icon v-if="selectedCard && selectedCard.id === card.id" color="primary" class="select-card-check">mdi-check-circle</v-icon>
                        </div>
                    </template>
                    <div v-if="cards.length === 0" class="no-cards-message">
                        <v-icon size="48" color="primary">mdi-credit-card-outline</v-icon>
                        <div class="no-cards-title">No tienes tarjetas guardadas</div>
                        <div class="no-cards-subtitle">Agrega una tarjeta para realizar transferencias</div>
                    </div>
                </div>
                <v-card-actions class="select-card-actions">
                    <FilledButton class="add-card-btn" @click="showAddCardDialog = true">
                        Agregar tarjeta
                    </FilledButton>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Add Card Dialog -->
        <AddCardDialog
            :model-value="showAddCardDialog"
            @update:model-value="showAddCardDialog = $event"
            @card-added="fetchCards"
        />
    </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { supabase } from "@/plugins/supabase";
import { useSecurityStore } from "@/stores/securityStore";
import CustomTextField from "@/components/ui/CustomTextField.vue";
import FilledButton from "@/components/ui/FilledButton.vue";
import AddContactDialog from "@/components/AddContactDialog.vue";
import BackButton from "@/components/ui/BackButton.vue";
import { v4 as uuidv4 } from "uuid";
import type { Contact } from "@/types/types";
import { fetchContacts as fetchContactsBackend, removeContact as removeContactBackend } from '@/services/contacts';
import { useCardsStore } from '@/stores/cardsStore'
import { useAccountStore } from '@/stores/accountStore'
import AddCardDialog from '@/components/AddCardDialog.vue'
import { usePaymentStore } from '@/stores/paymentStore'
import type { PaymentRequest, Payment } from '@/api/payment'

interface DisplayCard {
    id: string
    brand: string
    number_last4: string
    expiry: string
    holder: string
    logo: string
}

interface ContactData {
    contact_id: string;
    contacts: {
        first_name: string;
        last_name: string;
        username: string;
        account: Array<{ account_number: string }> | null;
    };
}

const recipient = ref("");
const amount = ref("");
const reason = ref("");
const showConfirmDialog = ref(false);
const showContactDialog = ref(false);
const errorMessage = ref("");
const recipientFirstName = ref("");
const recipientLastName = ref("");
const showSuccessDialog = ref(false);
const contacts = ref<Contact[]>([]);
const loading = ref(false);
const showAddContactDialog = ref(false);
const showPaymentMethodDialog = ref(false)
const showAddCardDialog = ref(false)
const selectedPaymentMethod = ref<'account' | 'card'>('account')
const selectedCard = ref<DisplayCard | null>(null)
const cardsStore = useCardsStore()
const accountStore = useAccountStore()
const paymentStore = usePaymentStore()
const isClearingFields = ref(false)

const securityStore = useSecurityStore();
const userId = computed(() => securityStore.user?.id?.toString());

const showErrorDialog = ref(false);
const errorDialogMessage = ref("");

async function fetchContacts() {
    if (!userId.value) return;
    try {
        const { contacts: fetchedContacts } = await fetchContactsBackend(userId.value);
        contacts.value = fetchedContacts;
    } catch (error) {
        console.error("Error fetching contacts:", error);
    }
}

onMounted(fetchContacts);

function selectContact(contact: Contact) {
    recipient.value = contact.username;
    showContactDialog.value = false;
}

// Helper functions for validation
function isValidCvu(value: string): boolean {
    // CVU is 20 chars, uppercase letters (except I) and numbers
    const cvuRegex = /^[A-HJ-Z0-9]{20}$/;
    return cvuRegex.test(value);
}

function isValidAlias(value: string): boolean {
    // Alias is three uppercase words separated by dots
    const aliasRegex = /^[A-Z]+\.[A-Z]+\.[A-Z]+$/;
    return aliasRegex.test(value);
}

function isValidEmail(value: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(value);
}

const isTransferValid = computed(() => {
    const n = parseFloat(amount.value);
    const recipientValue = recipient.value.trim();
    const descriptionValue = reason.value.trim();
    
    if (isNaN(n) || n <= 0) return false;
    if (!recipientValue) return false;
    if (!descriptionValue) return false;
    
    // Check if using account balance and if there's sufficient balance
    if (selectedPaymentMethod.value === 'account' && n > accountBalance.value) {
        errorMessage.value = "Saldo insuficiente para realizar la transferencia.";
        return false;
    }
    
    return isValidEmail(recipientValue) || 
           isValidCvu(recipientValue) || 
           isValidAlias(recipientValue);
});

function handleAmountInput() {
    // Remove any non-digit characters
    let value = amount.value.replace(/\D/g, "");
    // Limit to 10 digits
    value = value.slice(0, 10);
    amount.value = value;

    // Only validate if there's a value
    if (value) {
        const n = parseFloat(value);
        if (isNaN(n) || n <= 0) {
            errorMessage.value = "El monto debe ser mayor a cero.";
        } else if (selectedPaymentMethod.value === 'account' && n > accountBalance.value) {
            errorMessage.value = "Saldo insuficiente para realizar la transferencia.";
        } else {
            // Clear error if it was related to amount
            if (errorMessage.value === "El monto debe ser mayor a cero." || 
                errorMessage.value === "Saldo insuficiente para realizar la transferencia.") {
                errorMessage.value = "";
            }
        }
    } else {
        // Clear amount-related errors when field is empty
        if (errorMessage.value === "El monto debe ser mayor a cero." || 
            errorMessage.value === "Saldo insuficiente para realizar la transferencia.") {
            errorMessage.value = "";
        }
    }
}

function formatNumber(value: string) {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

async function handleTransfer() {
    errorMessage.value = "";
    const n = parseFloat(amount.value);
    const recipientValue = recipient.value.trim();
    const descriptionValue = reason.value.trim();
    
    // Debug validation
    console.log('Validating recipient:', recipientValue);
    console.log('Is email?', isValidEmail(recipientValue));
    console.log('Is CVU?', isValidCvu(recipientValue));
    console.log('Is alias?', isValidAlias(recipientValue));
    console.log('Payment method:', selectedPaymentMethod.value);
    console.log('Account balance:', accountBalance.value);
    
    if (isNaN(n) || n <= 0) {
        errorMessage.value = "El monto debe ser mayor a cero.";
        return;
    }
    if (!recipientValue) {
        errorMessage.value = "Debes ingresar un email, CVU o alias.";
        return;
    }
    if (!descriptionValue) {
        errorMessage.value = "Debes ingresar una descripción.";
        return;
    }
    if (selectedPaymentMethod.value === 'account' && n > accountBalance.value) {
        errorMessage.value = "Saldo insuficiente para realizar la transferencia.";
        return;
    }

    // Get sender user id
    if (!securityStore.isLoggedIn || !securityStore.user?.id) {
        errorMessage.value = "Usuario no autenticado.";
        return;
    }

    try {
        // Validate recipient format
        if (!isValidEmail(recipientValue) && !isValidCvu(recipientValue) && !isValidAlias(recipientValue)) {
            console.log('Invalid recipient format');
            errorMessage.value = "Formato de email, CVU o alias inválido.";
            return;
        }

        // Show confirmation dialog with generic recipient info
        // The actual recipient info will be returned by the transfer endpoint
        recipientFirstName.value = "Usuario";
        recipientLastName.value = "";
        showConfirmDialog.value = true;
    } catch (error) {
        console.error('Transfer validation error:', error);
        showErrorDialog.value = true;
        errorDialogMessage.value = error instanceof Error ? error.message : "Error al validar la transferencia.";
        return;
    }
}

async function confirmTransfer() {
    if (!amount.value || !recipient.value || !reason.value || !userId.value) return;
    const n = parseFloat(amount.value);
    const recipientValue = recipient.value.trim();
    const descriptionValue = reason.value.trim();

    // Double check balance before confirming transfer
    if (selectedPaymentMethod.value === 'account' && n > accountBalance.value) {
        errorMessage.value = "Saldo insuficiente para realizar la transferencia.";
        showConfirmDialog.value = false;
        return;
    }

    // Debug validation
    console.log('Confirming transfer for recipient:', recipientValue);
    console.log('Is email?', isValidEmail(recipientValue));
    console.log('Is CVU?', isValidCvu(recipientValue));
    console.log('Is alias?', isValidAlias(recipientValue));
    console.log('Payment method:', selectedPaymentMethod.value);
    console.log('Selected card:', selectedCard.value);
    console.log('Account balance:', accountBalance.value);

    try {
        const payload: PaymentRequest = {
            amount: n,
            description: descriptionValue,
            metadata: {}
        };
        
        let payment: Payment;
        let transferType: 'email' | 'cvu' | 'alias';
        const cardId = selectedPaymentMethod.value === 'card' && selectedCard.value ? selectedCard.value.id : undefined;
        
        if (isValidEmail(recipientValue)) {
            transferType = 'email';
            console.log('Confirming transfer by email with payload:', payload, 'cardId:', cardId);
            payment = await paymentStore.transferByEmail(recipientValue, payload, cardId);
        } else if (isValidCvu(recipientValue)) {
            transferType = 'cvu';
            console.log('Confirming transfer by CVU with cardId:', cardId);
            payment = await paymentStore.transferByCVU(recipientValue, payload, cardId);
        } else if (isValidAlias(recipientValue)) {
            transferType = 'alias';
            console.log('Confirming transfer by alias with cardId:', cardId);
            payment = await paymentStore.transferByAlias(recipientValue, payload, cardId);
        } else {
            console.log('Invalid recipient format during confirmation');
            showErrorDialog.value = true;
            errorDialogMessage.value = "Formato de email, CVU o alias inválido.";
            return;
        }

        // Update recipient info from the payment response
        recipientFirstName.value = payment.receiver.firstName;
        recipientLastName.value = payment.receiver.lastName;

        console.log(`Transfer confirmed by ${transferType}:`, {
            recipient: recipientValue,
            amount: n,
            reason: descriptionValue,
            paymentId: payment.id,
            cardId: cardId
        });

        // Success
        showConfirmDialog.value = false;
        isClearingFields.value = true; // Set flag before clearing
        errorMessage.value = "";
        recipient.value = "";
        amount.value = "";
        reason.value = "";
        showSuccessDialog.value = true;
        isClearingFields.value = false; // Reset flag after clearing
    } catch (error) {
        console.error('Transfer confirmation error:', error);
        showConfirmDialog.value = false;
        showErrorDialog.value = true;
        errorDialogMessage.value = error instanceof Error ? error.message : "Error al confirmar la transferencia.";
        return;
    }
}

async function removeContact(contactId: string) {
    if (!userId.value) return;
    try {
        await removeContactBackend(userId.value, contactId);
        await fetchContacts();
    } catch (error) {
        console.error("Error removing contact:", error);
    }
}

const accountBalance = computed(() => accountStore.account?.balance || 0)

const cards = computed<DisplayCard[]>(() => {
    if (!cardsStore.cards) return []
    return cardsStore.cards.map(card => {
        const cardType = card.type === 'CREDIT' ? 'Crédito' : 'Débito'
        const last4 = card.number.match(/\d{4}$/)?.[0] || ''
        return {
            id: String(card.id),
            brand: card.metadata?.brand || getCardBrand(card.number),
            number_last4: last4,
            expiry: card.expirationDate,
            holder: card.fullName,
            logo: getBrandLogo(card.metadata?.brand || getCardBrand(card.number))
        }
    })
})

function getCardBrand(number: string) {
    const n = number.replace(/\D/g, '')
    if (n.startsWith('4')) return 'Visa'
    if (n.startsWith('5') || n.startsWith('2')) return 'Mastercard'
    if (n.startsWith('3')) return 'Amex'
    return 'Desconocida'
}

function getBrandLogo(brand: string) {
    if (brand === 'Visa') return 'https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png'
    if (brand === 'Mastercard') return 'https://brandlogos.net/wp-content/uploads/2021/11/mastercard-logo.png'
    if (brand === 'Amex') return 'https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg'
    return 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
}

function selectPaymentMethod(method: 'account' | 'card') {
    selectedPaymentMethod.value = method
    if (method === 'account') {
        selectedCard.value = null
    }
    showPaymentMethodDialog.value = false
}

function selectCard(card: DisplayCard) {
    selectedCard.value = card
    selectedPaymentMethod.value = 'card'
    showPaymentMethodDialog.value = false
}

async function fetchCards() {
    try {
        await cardsStore.fetchCards()
    } catch (error) {
        console.error('Error fetching cards:', error)
    }
}

onMounted(() => {
    fetchCards()
    accountStore.fetchAccount()
})
</script>

<style scoped>
.transfer-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    background: var(--background);
    position: relative;
    padding-top: 1rem;
}
.back-btn-top-left {
    position: absolute;
    top: 32px;
    left: 32px;
    z-index: 10;
}

.transfer-content {
    margin: 0 auto;
    margin-top: 24px;
    max-width: 400px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.transfer-title {
    font-size: 2.2rem;
    font-weight: 800;
    text-align: center;
    margin-bottom: 2.2rem;
    font-family: var(--font-sans), sans-serif;
    color: var(--text);
}

.transfer-form-group {
    margin-bottom: 0.4rem;
    width: 100%;
    max-width: 400px;
}
.transfer-form-group:last-of-type {
    margin-bottom: 0;
}
.transfer-recipient-input,
.transfer-amount-input,
.transfer-reason-input {
    width: 100%;
    max-width: 400px;
}

.transfer-continue-btn {
    margin-top: 1.5rem;
    font-size: 1.1rem;
    font-weight: 700;
    height: 50px;
    width: 100%;
    max-width: 400px;
    align-self: center;
}

.recipient-contact-btn {
    background: transparent !important;
    color: var(--muted-text) !important;
    box-shadow: none !important;
    min-width: 36px;
    min-height: 36px;
    padding: 0;
}

.confirm-transfer-dialog {
    border-radius: 2rem !important;
    overflow: visible;
    box-shadow: 0 2px 16px 0 rgba(60, 60, 60, 0.1);
    width: 100%;
    max-width: 650px;
    margin: 0 auto;
    padding: 2rem 3rem;
}

.confirm-transfer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 1rem 0;
}

.confirm-transfer-title {
    font-size: 1.4rem;
    font-weight: 700;
    font-family: var(--font-sans), sans-serif;
}

.confirm-transfer-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    width: 100%;
}

.confirm-transfer-table {
    background: var(--card);
    border-radius: 1.5rem;
    padding: 1.5rem 2rem;
    margin-bottom: 2rem;
    width: 100%;
    box-shadow: 0 1px 6px 0 rgba(60, 60, 60, 0.06);
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
}

.confirm-transfer-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text);
    font-family: var(--font-sans), sans-serif;
}

.confirm-transfer-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
}

.confirm-transfer-btn {
    min-width: 200px;
    font-size: 1.1rem;
    font-weight: 600;
    border-radius: 1.5rem;
    padding: 0.8rem 2rem;
}

.select-contact-dialog {
    border-radius: 1.5rem !important;
    overflow: visible;
    box-shadow: 0 2px 16px 0 rgba(60, 60, 60, 0.1);
    max-width: 960px;
    margin: 0 auto;
    padding: 2rem 3rem;
}
.select-contact-dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 1rem 0;
}
.select-contact-title {
    font-size: 1.4rem;
    font-weight: 700;
    font-family: var(--font-sans), sans-serif;
}
.select-contact-list-custom {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: 400px;
    overflow-y: auto;
    margin: 1.5rem 0;
    width: 100%;
    padding-right: 0.5rem;
}
.select-contact-custom {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #f8fafc;
    border-radius: 14px;
    border: 2px solid #e0e0e0;
    padding: 1rem 1.5rem;
    cursor: pointer;
    transition: border-color 0.18s, background 0.18s;
    position: relative;
}
.select-contact-custom:hover {
    border-color: var(--primary);
    background: #f0f4f8;
}
.select-contact-avatar {
    width: 48px;
    height: 48px;
    object-fit: contain;
    margin-right: 1.5rem;
    color: var(--primary);
}
.select-contact-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    cursor: pointer;
}
.select-contact-name {
    font-weight: 700;
    font-size: 1.2rem;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 0.3rem;
}
.select-contact-detail {
    font-size: 1rem;
    color: var(--muted-text);
    margin-top: 0.2rem;
}
.transfer-error-message {
    color: #e53935;
    font-size: 1.02rem;
    margin-top: 0.7rem;
    margin-bottom: 0.5rem;
    text-align: center;
    font-family: var(--font-sans, sans-serif);
}
.success-dialog {
    border-radius: 16px;
    padding: 1.5rem;
    text-align: center;
}

.success-dialog-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 1rem;
}

.dialog-close-btn {
    color: var(--muted-text) !important;
    margin-right: -8px;
}

.success-dialog-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.2rem;
    padding: 0 1rem 1rem;
}
.success-dialog-title {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--primary);
    margin-top: 0.5rem;
}
.success-dialog-message {
    font-size: 1.05rem;
    color: var(--text);
    margin-bottom: 1rem;
}
.success-dialog-btn {
    min-width: 120px;
    font-size: 1.1rem;
    font-weight: 600;
    border-radius: 1.5rem;
    padding: 0.7rem 2rem;
    margin-top: 0.5rem;
}

.remove-contact-btn {
    opacity: 0.7;
    transition: opacity 0.2s;
}

.remove-contact-btn:hover {
    opacity: 1;
}

.no-contacts-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    text-align: center;
    background: #f8fafc;
    border-radius: 14px;
    border: 2px dashed #e0e0e0;
    width: 100%;
    gap: 1rem;
}

.no-contacts-title {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text);
    font-family: var(--font-sans), sans-serif;
}

.no-contacts-subtitle {
    font-size: 1.05rem;
    color: var(--muted-text);
    font-family: var(--font-sans), sans-serif;
}

.deposit-method-box {
    display: flex;
    align-items: center;
    border: 1.5px solid var(--border);
    border-radius: 12px;
    background: transparent;
    height: 48px;
    padding: 0 1.1rem;
    width: 100%;
    box-sizing: border-box;
    transition: border-color 0.18s;
    font-size: 1.06rem;
    font-family: var(--font-sans, sans-serif);
    cursor: pointer;
    outline: none;
    gap: 0.8rem;
}

.deposit-method-box:hover,
.deposit-method-box:focus {
    border-color: var(--primary);
}

.deposit-card-logo {
    width: 32px;
    height: 32px;
    object-fit: contain;
    display: flex;
    align-items: center;
}

.deposit-method-icon {
    font-size: 24px;
}

.deposit-method-text {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text);
    flex: 1;
    font-family: var(--font-sans), sans-serif;
    display: flex;
    align-items: center;
    height: 100%;
}

.deposit-select-icon {
    color: var(--muted-text);
    margin-left: auto;
    display: flex;
    align-items: center;
    height: 100%;
}

.select-card-dialog {
    border-radius: 2rem !important;
    overflow: visible;
    box-shadow: var(--shadow-card);
    max-width: 960px;
    margin: 0 auto;
    padding: 2rem 3rem;
}

.select-card-dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 1rem 0;
}

.select-card-title {
    font-size: 1.4rem;
    font-weight: 700;
    font-family: var(--font-sans), sans-serif;
}

.select-card-list-custom {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 1rem;
    max-height: 400px;
    overflow-y: auto;
    margin: 1.5rem 0;
    width: 100%;
    padding-right: 0.5rem;
}

.select-card-custom {
    width: 100%;
    display: flex;
    align-items: center;
    background: var(--input);
    border-radius: 14px;
    border: 2px solid var(--card-border);
    padding: 1rem 1.5rem;
    cursor: pointer;
    transition: border-color 0.18s, background 0.18s;
    position: relative;
}

.select-card-custom.selected {
    border-color: var(--primary);
    background: var(--muted);
}

.select-card-custom:hover {
    border-color: var(--primary);
    background: var(--card);
}

.select-card-logo {
    width: 48px;
    height: 48px;
    object-fit: contain;
    margin-right: 1.5rem;
}

.select-card-icon {
    margin-right: 1.5rem;
}

.select-card-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.select-card-brand {
    font-weight: 700;
    font-size: 1.2rem;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 0.3rem;
}

.select-card-balance,
.select-card-expiry {
    font-size: 1rem;
    color: var(--muted-text);
    margin-top: 0.2rem;
}

.select-card-check {
    font-size: 1.8rem;
    margin-left: 1.5rem;
}

.select-card-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 1.5rem 0 0 0;
}

.add-card-btn {
    min-width: 200px;
    font-size: 1.1rem;
    font-weight: 600;
    border-radius: 1.5rem;
    padding: 0.8rem 2rem;
}

.error-dialog {
    border-radius: 16px;
    padding: 1.5rem;
    text-align: center;
}

.error-dialog-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 1rem;
}

.error-dialog-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.2rem;
    padding: 0 1rem 1rem;
}

.error-dialog-title {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--error);
    margin-top: 0.5rem;
}

.error-dialog-message {
    font-size: 1.05rem;
    color: var(--text);
    margin-bottom: 1rem;
}
</style>

