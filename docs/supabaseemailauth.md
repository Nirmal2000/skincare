supabaseemailauth.mdYou can do this with Supabase’s **email OTP + password** combo:

**Flow you want:**

1. User enters **email** → you send OTP to email.
2. User enters **OTP** → you verify it and create a session.
3. While logged in (email verified), you **set their password**.
4. Next time, they just use **email + password** to sign in.

I’ll show this with `@supabase/supabase-js` (works in Expo React Native too).

---

## 1. Supabase dashboard setup

1. In **Auth → Providers → Email**:

   * Make sure **Email** and **Email + Password** are enabled. ([Supabase][1])
2. To send a **numeric OTP code** (instead of just a magic link):

   * Go to **Auth → Email Templates → Magic Link / Signup**.
   * Use `{{ .Token }}` somewhere in the email body. That makes Supabase send a 6-digit OTP your user will type into the app. ([Supabase][2])

---

## 2. Step 1 – Ask for email and send OTP

**Screen 1: “Enter your email”**

```ts
// supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);
```

```ts
// requestEmailOtp.ts
import { supabase } from './supabaseClient';

export async function sendEmailOtp(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // true = auto-create user if not exists (typical for signup)
      shouldCreateUser: true,
    },
  });

  if (error) throw error;
  // data.user & data.session are null here; OTP is sent by email
}
```

This uses Supabase’s **passwordless email OTP** flow. ([Supabase][3])

UI-wise:

* Validate email.
* Call `sendEmailOtp`.
* Show “OTP sent to [xyz@email.com](mailto:xyz@email.com)”.

---

## 3. Step 2 – Verify OTP and log the user in

**Screen 2: “Enter the 6-digit code”**

```ts
// verifyEmailOtp.ts
import { supabase } from './supabaseClient';

export async function verifyEmailOtp(email: string, code: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: 'email', // email OTP
  });

  if (error) throw error;

  // If successful, you now have a valid session and a user
  return data.session; // contains access_token, user, etc.
}
```

`verifyOtp` with `type: 'email'` logs the user in if the OTP is valid. ([Supabase][4])

In your app:

* If verification is successful → **navigate to “Set Password” screen**.
* Store the email in state so you can use it later if needed.

---

## 4. Step 3 – Set the password after OTP verification

Now the user is authenticated and their email is verified. You can attach a password to this account.

**Screen 3: “Create password”**

```ts
// setPasswordAfterOtp.ts
import { supabase } from './supabaseClient';

export async function setInitialPassword(password: string) {
  const { data, error } = await supabase.auth.updateUser({
    password,
  });

  if (error) throw error;
  return data.user;
}
```

`updateUser()` can update the password **for the currently logged-in user**. ([Supabase][5])

UI flow:

* Check session exists (from previous OTP step).
* Validate password (length, complexity, etc).
* Call `setInitialPassword`.
* Optionally show “Account created!” and go to your main app.

---

## 5. Step 4 – Normal email + password login

From now on you can use standard **email/password** auth.

**Login screen:**

```ts
// emailPasswordLogin.ts
import { supabase } from './supabaseClient';

export async function loginWithEmailPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data.session;
}
```

This is regular password-based auth. ([Supabase][6])

---

## 6. Extra details / gotchas

* **OTP rate limit & expiry**: by default, 1 OTP request per 60s; codes expire after 1 hour. You can tweak this in **Auth → Providers → Email → Email OTP Expiration**. ([Supabase][7])
* **Resend OTP**: If user didn’t get a code, you can call `signInWithOtp` again or use `auth.resend()` for certain flows. ([Supabase][8])
* **React Native / Expo**: This same `supabase-js` approach works. For deep linking (if you ever use magic links or password reset instead of numeric OTP), set up a custom scheme in Expo and add it as an allowed redirect URL in Supabase. ([Supabase][9])
* **Security**:

  * Validate email & password on client and (if needed) re-check on server.
  * Optionally limit signups per device/IP, add CAPTCHA, etc.

---

[1]: https://supabase.com/docs/guides/auth/passwords?utm_source=chatgpt.com "Password-based Auth | Supabase Docs"
[2]: https://supabase.com/docs/guides/auth/auth-email-templates?utm_source=chatgpt.com "Email Templates | Supabase Docs"
[3]: https://supabase.com/docs/reference/javascript/auth-signinwithotp?utm_source=chatgpt.com "JavaScript: Sign in a user through OTP"
[4]: https://supabase.com/docs/reference/javascript/auth-verifyotp?utm_source=chatgpt.com "JavaScript: Verify and log in through OTP"
[5]: https://supabase.com/docs/reference/javascript/auth-updateuser?utm_source=chatgpt.com "JavaScript: Update a user | Supabase Docs"
[6]: https://supabase.com/docs/reference/javascript/auth-signinwithpassword?utm_source=chatgpt.com "JavaScript: Sign in a user | Supabase Docs"
[7]: https://supabase.com/docs/guides/auth/auth-email-passwordless?utm_source=chatgpt.com "Passwordless email logins | Supabase Docs"
[8]: https://supabase.com/docs/reference/javascript/auth-resend?utm_source=chatgpt.com "JavaScript: Resend an OTP | Supabase Docs"
[9]: https://supabase.com/docs/guides/auth/native-mobile-deep-linking?utm_source=chatgpt.com "Native Mobile Deep Linking | Supabase Docs"
