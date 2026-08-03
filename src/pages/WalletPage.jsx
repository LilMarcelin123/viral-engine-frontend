import { useUserRole } from "@/hooks/useUserRole";
import AdminWallet from "@/components/wallet/AdminWallet";
import EditorWallet from "@/components/wallet/EditorWallet";

export default function WalletPage() {
  const { isAdmin } = useUserRole();
  return isAdmin ? <AdminWallet /> : <EditorWallet />;
}