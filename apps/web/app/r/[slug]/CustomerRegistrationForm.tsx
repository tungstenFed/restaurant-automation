'use client';

import { useState, type FormEvent } from 'react';

interface CustomerRegistrationFormProps {
  slug: string;
  restaurantName: string;
}

interface RegistrationSuccess {
  id: string;
  customerName: string;
  phone: string;
  birthday: string | null;
  restaurantName: string;
}

export function CustomerRegistrationForm({
  slug,
  restaurantName,
}: CustomerRegistrationFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [consent, setConsent] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<RegistrationSuccess | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/crm/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          firstName,
          lastName,
          phone,
          birthday,
          consent,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        restaurantName?: string;
        customer?: {
          id: string;
          name: string;
          phone: string;
          birthday: string | null;
        };
      };

      if (!response.ok) {
        setErrorMessage(
          payload.error ?? 'Si è verificato un errore. Riprova tra poco.'
        );
        return;
      }

      setSuccessData({
        id: payload.customer?.id ?? '',
        customerName: payload.customer?.name ?? `${firstName} ${lastName}`.trim(),
        phone: payload.customer?.phone ?? phone,
        birthday: payload.customer?.birthday ?? birthday,
        restaurantName: payload.restaurantName ?? restaurantName,
      });
    } catch {
      setErrorMessage('Errore di connessione. Controlla la rete e riprova.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (successData) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-xl font-bold text-white">
          ✓
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          Registrazione completata!
        </h2>
        <p className="mt-2 text-sm text-gray-700">
          Grazie <span className="font-medium">{successData.customerName}</span>, i
          tuoi dati sono stati salvati per{' '}
          <span className="font-medium">{successData.restaurantName}</span>.
        </p>
        <div className="mt-4 space-y-1 rounded-lg border border-emerald-200 bg-white/80 p-3 text-left text-xs text-gray-600">
          <p>
            <span className="font-medium text-gray-800">Telefono:</span>{' '}
            {successData.phone}
          </p>
          {successData.birthday && (
            <p>
              <span className="font-medium text-gray-800">Data di nascita:</span>{' '}
              {successData.birthday}
            </p>
          )}
          {successData.id && (
            <p className="truncate">
              <span className="font-medium text-gray-800">ID cliente:</span>{' '}
              <code className="font-mono text-[11px]">{successData.id}</code>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setSuccessData(null);
            setFirstName('');
            setLastName('');
            setPhone('');
            setBirthday('');
            setConsent(false);
          }}
          className="mt-5 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Registra un altro cliente
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-700"
          >
            Nome
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            autoComplete="given-name"
            placeholder="Mario"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700"
          >
            Cognome
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            autoComplete="family-name"
            placeholder="Rossi"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-700"
        >
          Numero di telefono
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="+39 333 123 4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
      </div>

      <div>
        <label
          htmlFor="birthday"
          className="block text-sm font-medium text-gray-700"
        >
          Data di nascita
        </label>
        <input
          id="birthday"
          name="birthday"
          type="date"
          required
          max={new Date().toISOString().slice(0, 10)}
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
      </div>

      <label className="flex items-start gap-2.5 pt-1 text-sm text-gray-600">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
        />
        <span>
          Acconsento al trattamento dei miei dati per ricevere promozioni e codici
          sconto del ristorante.
        </span>
      </label>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
        >
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Salvataggio in corso...' : 'Registrati'}
      </button>
    </form>
  );
}
