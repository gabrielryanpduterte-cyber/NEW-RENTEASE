import AppShell from '../../components/AppShell.jsx';
import AccountSettingsCard from '../../components/AccountSettingsCard.jsx';
import LinkAccountsCard from '../../components/LinkAccountsCard.jsx';

function AccountPage() {
  return (
    <AppShell
      title="Account Settings"
      subtitle="Manage your profile and account preferences"
    >
      <LinkAccountsCard
        title="Parent/Guardian Access"
        description="Approve parent link requests so they can monitor your reservations and payments."
      />

      <AccountSettingsCard
        title="Profile Information"
        description="Update your personal information and change your password."
      />
    </AppShell>
  );
}

export default AccountPage;
