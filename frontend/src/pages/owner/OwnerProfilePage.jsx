import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import AccountSettingsCard from '../../components/AccountSettingsCard.jsx';
import AppShell from '../../components/AppShell.jsx';
import ModuleCard from '../../components/ModuleCard.jsx';

export default function OwnerProfilePage() {
  return (
    <AppShell
      title="Profile & Settings"
      subtitle="Personal account settings and owner account links."
    >
      <AccountSettingsCard
        id="owner-account-settings"
        title="Personal Information"
        description="Maintain your owner profile and change your password."
      />

      <ModuleCard
        id="owner-house-shortcut"
        title="Boarding House"
        description="Manage your public boarding house listing from the owner profile."
        actions={
          <Link className="button-light" to="/owner/boarding-house">
            <ExternalLink size={16} /> Edit Listing
          </Link>
        }
      />
    </AppShell>
  );
}
