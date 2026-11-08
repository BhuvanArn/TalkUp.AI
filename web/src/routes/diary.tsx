import { InputMolecule } from '@/components/molecules/input-molecule';
import type {
  InputChangeEvent,
  SelectChangeEvent,
  TextAreaChangeEvent,
} from '@/types/events';
import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/diary')({
  beforeLoad: createAuthGuard('/diary'),
  component: Diary,
});

function Diary() {
  const { t } = useTranslation('app');
  const [baseValue, setBaseValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [selectorValue, setSelectorValue] = useState('option1');
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');
  const [feedbackValue, setFeedbackValue] = useState('');

  return (
    <div className="p-4 space-y-6">
      <h3 className="text-primary text-2xl font-bold font-display">
        {t('diary.title')}
      </h3>
      <p className="text-gray-600">{t('diary.description')}</p>

      <InputMolecule
        inputType="base"
        name="baseInputExample"
        id="baseInputExample"
        label={t('diary.name.label')}
        helperText={t('diary.name.helper')}
        placeholder={t('diary.name.placeholder')}
        type="text"
        value={baseValue}
        onChange={(e: InputChangeEvent) => setBaseValue(e.target.value)}
        required
      />

      <InputMolecule
        inputType="textarea"
        name="descriptionInput"
        id="descriptionInput"
        label={t('diary.project.label')}
        helperText={t('diary.project.helper')}
        placeholder={t('diary.project.placeholder')}
        value={textareaValue}
        onChange={(e: TextAreaChangeEvent) => setTextareaValue(e.target.value)}
        rows={5}
        resize={true}
        maxLength={200}
      />

      <InputMolecule
        inputType="selector"
        name="favoriteFruitSelector"
        id="favoriteFruitSelector"
        label={t('diary.fruit.label')}
        helperText={t('diary.fruit.helper')}
        value={selectorValue}
        onChange={(e: SelectChangeEvent) => setSelectorValue(e.target.value)}
        options={[
          { value: 'option1', label: t('diary.fruit.apple') },
          { value: 'option2', label: t('diary.fruit.banana') },
          { value: 'option3', label: t('diary.fruit.cherry') },
        ]}
      />

      <InputMolecule
        inputType="checkbox"
        name="newsletterSubscription"
        id="newsletterSubscription"
        label={t('diary.newsletter.label')}
        helperText={t('diary.newsletter.helper')}
        value={checkboxValue}
        onChange={(e: InputChangeEvent) => setCheckboxValue(e.target.checked)}
      />

      <InputMolecule
        inputType="base"
        name="phoneInput"
        id="phoneInput"
        helperText={t('diary.phone.helper')}
        placeholder={t('diary.phone.placeholder')}
        type="tel"
        value={phoneValue}
        onChange={(e: InputChangeEvent) => setPhoneValue(e.target.value)}
      />

      <InputMolecule
        inputType="textarea"
        name="feedbackInput"
        id="feedbackInput"
        label={t('diary.feedback.label')}
        placeholder={t('diary.feedback.placeholder')}
        value={feedbackValue}
        onChange={(e: TextAreaChangeEvent) => setFeedbackValue(e.target.value)}
      />

      <InputMolecule
        inputType="base"
        name="disabledInput"
        id="disabledInput"
        label={t('diary.disabled.label')}
        helperText={t('diary.disabled.helper')}
        type="text"
        value={t('diary.disabled.value')}
        disabled
      />

      <InputMolecule
        inputType="base"
        name="readOnlyInput"
        id="readOnlyInput"
        label={t('diary.readOnly.label')}
        helperText={t('diary.readOnly.helper')}
        type="text"
        value={t('diary.readOnly.value')}
        readOnly
      />
    </div>
  );
}
