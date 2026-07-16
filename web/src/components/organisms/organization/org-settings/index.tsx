import { Avatar } from '@/components/atoms/avatar';
import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import type { OrganizationDetails } from '@/services/organization/types';
import { resizeImageFileToJpegDataUrl } from '@/utils/resizeImageToJpegDataUrl';
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';

const MIN_NAME_LENGTH = 2;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

/** Up to two initials from the org name, e.g. "Acme Corp" -> "AC". */
const initials = (name: string) =>
  name
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';

/** One read-only metadata cell in the "At a glance" rail. */
const MetaRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-0.5">
    <dt className="text-body-s text-text-weaker">{label}</dt>
    <dd className="text-body-m font-medium text-text">{value}</dd>
  </div>
);

/** F13 admin: edit org name + avatar (base64, matches backend profile_picture). */
export const OrgSettings = ({
  org,
  onSave,
  isSaving,
}: {
  org: OrganizationDetails;
  onSave: (body: {
    OrganizationName?: string;
    OrganizationProfilePicture?: string;
  }) => void;
  isSaving: boolean;
}) => {
  const [name, setName] = useState(org.organization_name);
  // null = untouched (fall back to org.profile_picture); '' would mean cleared,
  // but there is no backend clear action so we only ever set a new data URL.
  const [picture, setPicture] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-sync the controlled name when the org refetches (e.g. an out-of-band
  // rename), so a stale value can't silently revert a concurrent change on save.
  useEffect(() => {
    setName(org.organization_name);
  }, [org.organization_name]);

  const trimmedName = name.trim();
  const nameChanged = trimmedName !== org.organization_name;
  const pictureChanged = picture !== null;
  const nameTooShort = trimmedName.length < MIN_NAME_LENGTH;

  const isDirty = nameChanged || pictureChanged;
  const canSave = isDirty && !nameTooShort && !isSaving;

  const previewSrc = picture ?? org.profile_picture ?? undefined;
  const members = org.members ?? [];
  const memberCount = members.length;
  const employeeCount = members.filter(
    (m) => m.user_role === 'employee',
  ).length;
  const userCount = members.filter((m) => m.user_role === 'user').length;

  // Settings is an admin-only surface, so the full role breakdown is always
  // shown here: total members, employees, and plain users.
  const meta = useMemo(
    () => [
      {
        label: 'Members',
        value: `${memberCount} ${memberCount === 1 ? 'member' : 'members'}`,
      },
      {
        label: 'Employees',
        value: `${employeeCount} ${employeeCount === 1 ? 'employee' : 'employees'}`,
      },
      {
        label: 'Users',
        value: `${userCount} ${userCount === 1 ? 'user' : 'users'}`,
      },
      { label: 'Created', value: formatDate(org.created_at) },
      { label: 'Organization ID', value: org.organization_id },
    ],
    [
      memberCount,
      employeeCount,
      userCount,
      org.created_at,
      org.organization_id,
    ],
  );

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPicture(await resizeImageFileToJpegDataUrl(file));
    } catch {
      toast.error('That image could not be processed. Try a different file.');
    }
  };

  const handleReset = () => {
    setName(org.organization_name);
    setPicture(null);
  };

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      ...(nameChanged ? { OrganizationName: trimmedName } : {}),
      ...(pictureChanged ? { OrganizationProfilePicture: picture } : {}),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-h3 text-text">Organization settings</h2>
        <p className="text-body-m text-text-weaker">
          Update how your organization appears to every member.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Editable profile card */}
        <section className="flex flex-col rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
            <div className="flex items-center gap-2">
              <Icon icon="organization" size="sm" className="text-accent" />
              <h3 className="text-h5 text-text">Profile</h3>
            </div>
            {isDirty && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-weak px-2.5 py-0.5 text-body-s font-medium text-accent">
                <span className="size-1.5 rounded-full bg-accent" aria-hidden />
                Unsaved changes
              </span>
            )}
          </div>

          <div className="flex flex-col gap-6 p-6">
            {/* Logo block — the one bold moment: large preview + change control */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar
                src={previewSrc}
                alt={`${org.organization_name} logo`}
                fallback={initials(name || org.organization_name)}
                size="xl"
                className="shrink-0 border border-border bg-accent-weaker text-h5 text-accent"
              />
              <div className="flex flex-col gap-2">
                <p className="text-body-s-strong text-text">Logo</p>
                <p className="max-w-xs text-body-s text-text-weaker">
                  Square images work best. Saved as a JPEG preview.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    color="accent"
                    variant="outlined"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Icon icon="upload" size="sm" />
                      {previewSrc ? 'Change logo' : 'Upload logo'}
                    </span>
                  </Button>
                  {pictureChanged && (
                    <Button
                      color="neutral"
                      variant="text"
                      size="sm"
                      onClick={() => setPicture(null)}
                    >
                      Undo
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  aria-label="Upload organization logo"
                  onChange={(e) => {
                    void handleFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>

            {/* Name field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="org-name"
                className="text-body-s font-medium text-text-weaker"
              >
                Organization name
              </label>
              <input
                id="org-name"
                type="text"
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-body-m text-text transition-colors placeholder:text-text-weakest hover:border-border-strong focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                placeholder="Acme Corporation"
                aria-invalid={nameChanged && nameTooShort}
                aria-describedby="org-name-hint"
              />
              <p id="org-name-hint" className="text-body-s text-text-weaker">
                {nameChanged && nameTooShort
                  ? 'Use at least two characters.'
                  : 'This name appears across the organization workspace.'}
              </p>
            </div>
          </div>

          {/* Card footer with the primary action */}
          <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
            <Button
              color="neutral"
              variant="text"
              size="sm"
              disabled={!isDirty || isSaving}
              onClick={handleReset}
            >
              Discard
            </Button>
            <Button
              color="accent"
              size="sm"
              loading={isSaving}
              disabled={!canSave}
              onClick={handleSave}
            >
              Save changes
            </Button>
          </div>
        </section>

        {/* Read-only metadata rail */}
        <aside className="flex h-fit flex-col gap-4 rounded-xl border border-border bg-surface-raised p-6">
          <h3 className="text-body-s-strong uppercase tracking-wide text-text-weaker">
            At a glance
          </h3>
          <dl className="flex flex-col gap-4">
            {meta.map((row) => (
              <MetaRow key={row.label} label={row.label} value={row.value} />
            ))}
          </dl>
        </aside>
      </div>
    </div>
  );
};

export default OrgSettings;
