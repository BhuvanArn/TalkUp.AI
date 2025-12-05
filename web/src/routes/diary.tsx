import { InputMolecule } from '@/components/molecules/input-molecule';
import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/diary')({
  beforeLoad: createAuthGuard('/diary'),
  component: Diary,
});

function Diary() {
  const [baseValue, setBaseValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [selectorValue, setSelectorValue] = useState('option1');
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');
  const [feedbackValue, setFeedbackValue] = useState('');

  return (
    <div className="p-4 space-y-6">
      <h3 className="text-primary text-2xl font-bold font-display">
        Input Molecule Showcase
      </h3>
      <p className="text-gray-600">
        This page demonstrates the versatile `InputMolecule` component, capable
        of rendering various input types with labels and helper text.
      </p>

      <InputMolecule
        inputType="base"
        name="baseInputExample"
        id="baseInputExample"
        label="Your Name"
        helperText="Please enter your full name."
        placeholder="John Doe"
        value={baseValue}
        onChange={(e) => setBaseValue((e.target as HTMLInputElement).value)}
        required
      />

      <InputMolecule
        inputType="textarea"
        name="descriptionInput"
        id="descriptionInput"
        label="Project Description"
        helperText="Provide a brief description of your project (max 200 characters)."
        placeholder="Start typing here..."
        value={textareaValue}
        onChange={(e) =>
          setTextareaValue((e.target as HTMLTextAreaElement).value)
        }
        rows={5}
        resize={true}
        maxLength={200}
      />

      <InputMolecule
        inputType="selector"
        name="favoriteFruitSelector"
        id="favoriteFruitSelector"
        label="Choose Your Favorite Fruit"
        helperText="Select one option from the dropdown list."
        value={selectorValue}
        onChange={(e) =>
          setSelectorValue((e.target as HTMLSelectElement).value)
        }
        options={[
          { value: 'option1', label: 'Apple' },
          { value: 'option2', label: 'Banana' },
          { value: 'option3', label: 'Cherry' },
        ]}
      />

      <InputMolecule
        inputType="checkbox"
        name="newsletterSubscription"
        id="newsletterSubscription"
        label="Subscribe to our Newsletter"
        helperText="Tick this box to receive email updates and promotions."
        value={checkboxValue}
        onChange={(e) =>
          setCheckboxValue((e.target as HTMLInputElement).checked)
        }
      />

      <InputMolecule
        inputType="base"
        name="phoneInput"
        id="phoneInput"
        helperText="Your phone number, including country code (e.g., +1234567890)."
        placeholder="+1234567890"
        value={phoneValue}
        onChange={(e) => setPhoneValue((e.target as HTMLInputElement).value)}
      />

      <InputMolecule
        inputType="textarea"
        name="feedbackInput"
        id="feedbackInput"
        label="Your Feedback"
        placeholder="Share your thoughts..."
        value={feedbackValue}
        onChange={(e) =>
          setFeedbackValue((e.target as HTMLTextAreaElement).value)
        }
      />

      <InputMolecule
        inputType="base"
        name="disabledInput"
        id="disabledInput"
        label="Disabled Field"
        helperText="This field is disabled and cannot be edited."
        value="You cannot edit this"
        disabled
      />

      <InputMolecule
        inputType="base"
        name="readOnlyInput"
        id="readOnlyInput"
        label="Read-Only Field"
        helperText="This field can be selected but not edited."
        value="This text is read-only"
        readOnly
      />
    </div>
  );
}
