import { Button } from '@/components/atoms/button';
import type { OrganizationDetails } from '@/services/organization/types';
import { resizeImageFileToJpegDataUrl } from '@/utils/resizeImageToJpegDataUrl';
import { useState } from 'react';
import toast from 'react-hot-toast';

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
  const [picture, setPicture] = useState<string | null>(null);

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-6">
      <h3 className="text-h4 text-text">Organization settings</h3>
      <div className="flex items-center gap-4">
        {(picture ?? org.profile_picture) && (
          <img
            src={picture ?? org.profile_picture ?? undefined}
            alt="Organization avatar"
            className="h-16 w-16 rounded-full object-cover"
          />
        )}
        <label className="text-body-s text-text-weaker">
          Avatar
          <input
            type="file"
            accept="image/*"
            className="block text-body-s"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                setPicture(await resizeImageFileToJpegDataUrl(file));
              } catch {
                toast.error('Could not process the image');
              }
            }}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-body-s text-text-weaker">
        Name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border border-border bg-background px-3 py-1.5 text-body-m text-text"
        />
      </label>
      <div>
        <Button
          color="accent"
          size="sm"
          disabled={isSaving || name.trim().length < 2}
          onClick={() =>
            onSave({
              ...(name.trim() !== org.organization_name
                ? { OrganizationName: name.trim() }
                : {}),
              ...(picture ? { OrganizationProfilePicture: picture } : {}),
            })
          }
        >
          Save changes
        </Button>
      </div>
    </section>
  );
};

export default OrgSettings;
