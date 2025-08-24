// Simple manual integration test for modals. Open the dashboard page and run this script
// in the browser console (or include it temporarily) to verify modal open/prefill behavior.
import { waitForModal } from '/src/lib/client/waitForModal.js';

async function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

async function testTransactionModal() {
  const modal = await waitForModal('transactionModal', 3000);
  modal.openModal({ type: 'income' });
  // Give it a tick to update internals
  await new Promise((r) => setTimeout(r, 50));
  // look for type radio inside modal
  const typeRadio = modal.querySelector('input[name="type"][value="income"]');
  await assert(typeRadio && typeRadio.checked, 'Transaction modal: income radio not checked');
  const selectedAccountId = localStorage.getItem('selectedAccountId');
  if (selectedAccountId) {
    const accountSelect = modal.querySelector('#accountId');
    await assert(accountSelect && accountSelect.value === selectedAccountId, 'Transaction modal: account not preselected from localStorage');
  }
  console.log('Transaction modal checks passed');
}

async function testRecurringModal() {
  const modal = await waitForModal('recurringTransactionModal', 3000);
  modal.openModal({ type: 'expense' });
  await new Promise((r) => setTimeout(r, 50));
  const typeRadio = modal.querySelector('input[name="type"][value="expense"]');
  await assert(typeRadio && typeRadio.checked, 'Recurring modal: expense radio not checked');
  const selectedAccountId = localStorage.getItem('selectedAccountId');
  if (selectedAccountId) {
    const accountSelect = modal.querySelector('#recurringAccountId');
    await assert(accountSelect && accountSelect.value === selectedAccountId, 'Recurring modal: account not preselected from localStorage');
  }
  console.log('Recurring modal checks passed');
}

export async function runAllTests() {
  try {
    await testTransactionModal();
    await testRecurringModal();
    console.log('All modal integration tests passed');
  } catch (err) {
    console.error('Modal integration tests failed', err);
  }
}

// Note: to run in browser console on dashboard page after scripts load:
// import('/src/lib/tests/modal-integration.js').then(m => m.runAllTests());
