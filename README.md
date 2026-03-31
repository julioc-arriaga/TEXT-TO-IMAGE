Welcome to the NextJS base template bootstrapped using the create-next-app. This template supports TypeScript, but you can use normal JavaScript as well.

Getting Started
Hit the run button to start the development server.

This app is a text-to-image generator backed by Replicate (Stable Diffusion).

1. Add your Replicate API token to Replit Secrets. **Use the exact key** `REPLICATE_API_TOKEN` (or `REPLICATE_TOKEN` / `REPLICATE_KEY` as fallbacks). Copy the token from [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens). After saving Secrets, **restart** the Repl so the server picks up the variable.
2. Run the app (Hit the run button or `npm run dev`).
3. Open the homepage, enter a prompt, and click `Generate`.

You can start editing the UI by modifying `src/app/page.tsx` and the components under `src/components/text-to-image/`.

API routes are under `/api/replicate/*` and handle polling + generation:
- `src/app/api/replicate/generate-image/route.ts` creates a prediction
- `src/app/api/replicate/predictions/[predictionId]/route.ts` polls prediction progress/output

Generated images are stored locally in your browser (localStorage) for the paginated history/gallery.

### See the exact API error (browser DevTools)

There is no **“Failing”** tab in DevTools. Use the **Network** panel and inspect the response body:

1. Open your app in the preview (or a normal browser tab).
2. Open DevTools:
   - **Chrome / Edge / Brave:** `F12` or `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (Mac).
   - If you only see **Console**, look at the **top row of tabs** and click **Network**. If tabs are cramped, click the `»` menu and choose **Network**.
3. With Network open, click **Generate** again so a new request appears.
4. In the **filter** box, type `generate-image` (or `replicate`).
5. Click the row for **`generate-image`** (status may be 500).
6. Open the **Response** (or **Preview**) sub-panel: that is the JSON from your Next.js route, usually `{ "error": "…" }` with Replicate’s message.

The app also logs a copy under **`[text2image] Request failed`** in the **Console** when a fetch fails.

Learn More
To learn more about Next.js, take a look at the following resources:

Next.js Documentation - learn about Next.js features and API.
Learn Next.js - an interactive Next.js tutorial.
Productionizing your Next App
To make your next App run smoothly in production make sure to deploy your project with Repl Deployments!

You can also produce a production build by running npm run build and changing the run command to npm run start.