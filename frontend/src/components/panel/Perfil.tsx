"use client";

import { useEffect, useRef, useState } from "react";
import { updateProfile, updateSalon, uploadSalonLogo } from "@/lib/api";
import { useAuth } from "./AuthContext";
import common from "./panelCommon.module.css";
import fieldStyles from "./NewAppointmentModal.module.css";
import styles from "./Perfil.module.css";

type ProfileFieldErrors = Partial<Record<"name" | "email", string>>;
type SalonFieldErrors = Partial<Record<"salonName", string>>;

const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function stripCountryCode(value: string): string {
  const digits = onlyDigits(value);
  return digits.startsWith("55") ? digits.slice(2) : digits;
}

function formatLocalWhatsapp(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function Perfil() {
  const { user, salon, setSession } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [errors, setErrors] = useState<ProfileFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [origin] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));
  const [copied, setCopied] = useState(false);

  const bookingUrl = salon ? `${origin}/agendar/${salon.slug}` : "";

  async function handleCopyLink() {
    if (!bookingUrl) return;
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const [salonName, setSalonName] = useState(salon?.name ?? "");
  const [whatsappNumber, setWhatsappNumber] = useState(() =>
    formatLocalWhatsapp(stripCountryCode(salon?.whatsappNumber ?? "")),
  );
  const [salonErrors, setSalonErrors] = useState<SalonFieldErrors>({});
  const [salonSubmitting, setSalonSubmitting] = useState(false);
  const [salonSubmitError, setSalonSubmitError] = useState<string | null>(null);
  const [salonSuccess, setSalonSuccess] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    };
  }, [logoPreviewUrl]);

  function handleLogoSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setLogoError("A imagem deve ter até 5MB.");
      return;
    }

    setLogoError(null);
    setLogoPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setPendingLogoFile(file);
  }

  function handleCancelLogo() {
    setLogoPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPendingLogoFile(null);
    setLogoError(null);
  }

  async function handleConfirmLogo() {
    if (!pendingLogoFile || !user) return;

    setLogoError(null);
    setLogoUploading(true);
    try {
      const updatedSalon = await uploadSalonLogo(pendingLogoFile);
      setSession({ user, salon: updatedSalon });
      handleCancelLogo();
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "Erro ao enviar a imagem.");
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setSuccess(false);

    const nextErrors: ProfileFieldErrors = {};
    if (!name.trim()) nextErrors.name = "Informe seu nome.";
    if (!email.trim()) nextErrors.email = "Informe seu email.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const data = await updateProfile({ name: name.trim(), email: email.trim() });
      setSession(data);
      setSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao salvar perfil.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSalonSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSalonSubmitError(null);
    setSalonSuccess(false);

    const nextErrors: SalonFieldErrors = {};
    if (!salonName.trim()) nextErrors.salonName = "Informe o nome do salão.";
    setSalonErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !user) return;

    setSalonSubmitting(true);
    try {
      const localDigits = onlyDigits(whatsappNumber);
      const updatedSalon = await updateSalon({
        name: salonName.trim(),
        whatsappNumber: localDigits ? `55${localDigits}` : "",
      });
      setSession({ user, salon: updatedSalon });
      setSalonSuccess(true);
    } catch (err) {
      setSalonSubmitError(err instanceof Error ? err.message : "Erro ao salvar dados do salão.");
    } finally {
      setSalonSubmitting(false);
    }
  }

  return (
    <div>
      <div className={common.pageHeader}>
        <div>
          <h2 className={common.pageTitle}>Perfil</h2>
          <p className={common.pageSubtitle}>Edite suas informações básicas.</p>
        </div>
      </div>

      {salon && (
        <div className={`${common.panel} ${styles.formPanel} ${styles.shareCard}`}>
          <h3 className={styles.shareTitle}>Fale de sua agenda para seus clientes.</h3>
          <p className={styles.shareSubtitle}>
            Compartilhe seu link com seus clientes para que eles possam realizar o agendamento dos serviços.
          </p>
          <div className={styles.shareLinkRow}>
            <span className={styles.shareLinkText}>{bookingUrl}</span>
            <button type="button" className={styles.copyBtn} onClick={handleCopyLink}>
              {copied ? "Copiado!" : "Copiar link"}
            </button>
          </div>
        </div>
      )}

      <div className={`${common.panel} ${styles.formPanel}`}>
        <form onSubmit={handleSubmit} noValidate>
          <div className={fieldStyles.field}>
            <label htmlFor="profile-name">Nome</label>
            <input
              id="profile-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((prev) => ({ ...prev, name: undefined }));
              }}
            />
            <span className={fieldStyles.error}>{errors.name}</span>
          </div>

          <div className={fieldStyles.field}>
            <label htmlFor="profile-email">Email</label>
            <input
              id="profile-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
            />
            <span className={fieldStyles.error}>{errors.email}</span>
          </div>

          {success && <p className={styles.success}>Perfil atualizado com sucesso.</p>}
          {submitError && <p className={fieldStyles.submitError}>{submitError}</p>}

          <button type="submit" className={fieldStyles.submitBtn} disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>
      </div>

      <div className={`${common.panel} ${styles.formPanel} ${styles.secondPanel}`}>
        <h3 className={styles.sectionTitle}>Dados do salão</h3>

        <div className={fieldStyles.field}>
          <label>Logo do salão</label>

          <button
            type="button"
            className={styles.logoDropzone}
            onClick={() => logoInputRef.current?.click()}
          >
            {logoPreviewUrl || salon?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreviewUrl ?? salon!.logoUrl!} alt="Logo" className={styles.logoDropzoneImg} />
            ) : (
              <>
                <span className={styles.logoAddIcon}>+</span>
                <span className={styles.logoAddLabel}>Adicionar</span>
              </>
            )}
          </button>

          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className={styles.logoFileInput}
            onChange={handleLogoSelect}
          />

          <div className={styles.logoGuidelines}>
            <p className={styles.logoGuidelinesTitle}>Certifique-se de que:</p>
            <ul>
              <li>A imagem tem fundo neutro ou transparente</li>
              <li>O logo aparece inteiro, sem cortes</li>
              <li>A imagem está nítida e legível</li>
              <li>Formatos aceitos: PNG, JPG, WEBP ou SVG, até 5MB</li>
            </ul>
          </div>

          {logoError && <span className={fieldStyles.error}>{logoError}</span>}

          {pendingLogoFile && (
            <div className={styles.logoConfirmRow}>
              <button type="button" className={styles.logoCancelBtn} onClick={handleCancelLogo} disabled={logoUploading}>
                Cancelar
              </button>
              <button type="button" className={fieldStyles.submitBtn} onClick={handleConfirmLogo} disabled={logoUploading}>
                {logoUploading ? "Enviando..." : "Confirmar e enviar"}
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSalonSubmit} noValidate>
          <div className={fieldStyles.field}>
            <label htmlFor="salon-name">Nome do salão</label>
            <input
              id="salon-name"
              value={salonName}
              onChange={(e) => {
                setSalonName(e.target.value);
                setSalonErrors((prev) => ({ ...prev, salonName: undefined }));
              }}
            />
            <span className={fieldStyles.error}>{salonErrors.salonName}</span>
          </div>

          <div className={fieldStyles.field}>
            <label htmlFor="salon-whatsapp">WhatsApp</label>
            <div className={styles.whatsappRow}>
              <span className={styles.whatsappPrefix}>+55</span>
              <input
                id="salon-whatsapp"
                placeholder="(11) 99999-9999"
                inputMode="tel"
                maxLength={15}
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(formatLocalWhatsapp(e.target.value))}
              />
            </div>
            <span className={fieldStyles.error}></span>
          </div>

          {salonSuccess && <p className={styles.success}>Dados do salão atualizados com sucesso.</p>}
          {salonSubmitError && <p className={fieldStyles.submitError}>{salonSubmitError}</p>}

          <button type="submit" className={fieldStyles.submitBtn} disabled={salonSubmitting}>
            {salonSubmitting ? "Salvando..." : "Salvar dados do salão"}
          </button>
        </form>
      </div>
    </div>
  );
}
