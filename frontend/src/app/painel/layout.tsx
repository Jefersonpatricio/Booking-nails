import PanelShell from "@/components/panel/PanelShell";
import PanelDataProvider from "@/components/panel/PanelDataContext";
import AuthProvider from "@/components/panel/AuthContext";

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PanelDataProvider>
        <PanelShell>{children}</PanelShell>
      </PanelDataProvider>
    </AuthProvider>
  );
}
