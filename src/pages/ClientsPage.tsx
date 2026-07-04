import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useClients } from '../hooks/useClients';
import { useInvoices } from '../hooks/useInvoices';
import { ClientCard } from '../components/clients/ClientCard';
import { ClientForm } from '../components/clients/ClientForm';
import { Modal } from '../components/shared/Modal';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { EmptyState } from '../components/shared/EmptyState';
import { TopBar } from '../components/layout/TopBar';
import { PageBackground } from '../components/layout/PageBackground';
import type { Client } from '../types/client';
import type { ClientFormValues } from '../schemas/clientSchema';
import clientsBg from '../assets/tveco-clients-bg.jpg';

export function ClientsPage() {
  const { clients, loading, addClient, updateClient, deleteClient } = useClients();
  const { invoices } = useInvoices();
  const [modalOpen, setModalOpen]       = useState(false);
  const [editTarget, setEditTarget]     = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleting, setDeleting]         = useState(false);

  async function handleAddClient(data: ClientFormValues) {
    await addClient(data);
    toast.success('Client added');
    setModalOpen(false);
  }

  async function handleEditClient(data: ClientFormValues) {
    if (!editTarget) return;
    await updateClient(editTarget.id, data);
    toast.success('Client updated');
    setEditTarget(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await deleteClient(deleteTarget.id); toast.success('Client deleted'); }
    catch { toast.error('Failed to delete client'); }
    finally { setDeleting(false); setDeleteTarget(null); }
  }

  const deleteHasInvoices = deleteTarget && invoices.some((i) => i.clientId === deleteTarget.id);

  return (
    <PageBackground image={clientsBg} position="center 60%">
      <TopBar
        title="Clients"
        subtitle={`${clients.length} saved`}
        actions={
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-3 sm:px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity" style={{ background: '#FF6B00' }}>
            <Plus size={16} />
            <span className="hidden sm:inline">Add Client</span>
            <span className="sm:hidden">Add</span>
          </button>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map((n) => (
              <div key={n} className="bg-brand-card border border-brand-border rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-brand-border rounded w-2/3 mb-3" />
                <div className="h-3 bg-brand-border rounded w-1/2 mb-4" />
                <div className="h-3 bg-brand-border rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : clients.length === 0 ? (
          <EmptyState
            icon={<Users size={28} />}
            title="No clients yet"
            description="Save client details to quickly populate invoices."
            action={
              <button onClick={() => setModalOpen(true)} className="px-4 py-2.5 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity" style={{ background: '#FF6B00' }}>
                Add Client
              </button>
            }
          />
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client, i) => (
                <motion.div key={client.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.05, duration: 0.3 }}>
                  <ClientCard client={client} invoices={invoices} onEdit={setEditTarget} onDelete={setDeleteTarget} />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Client" size="lg">
        <ClientForm onSubmit={handleAddClient} onCancel={() => setModalOpen(false)} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Client" size="lg">
        {editTarget && <ClientForm defaultValues={editTarget} onSubmit={handleEditClient} onCancel={() => setEditTarget(null)} submitLabel="Save Changes" />}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Client"
        description={deleteHasInvoices
          ? `${deleteTarget?.companyName} has existing invoices. Deleting won't remove those invoices. Continue?`
          : `Delete ${deleteTarget?.companyName}? This cannot be undone.`}
        confirmLabel="Delete" loading={deleting}
      />
    </PageBackground>
  );
}
