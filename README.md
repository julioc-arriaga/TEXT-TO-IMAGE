Welcome to the NextJS base template bootstrapped using the create-next-app. This template supports TypeScript, but you can use normal JavaScript as well.

Getting Started
Hit the run button to start the development server.

This app is a text-to-image generator backed by Replicate (Stable Diffusion).

1. Add your Replicate API token to Replit Secrets as `REPLICATE_API_TOKEN`.
2. Run the app (Hit the run button or `npm run dev`).
3. Open the homepage, enter a prompt, and click `Generate`.

You can start editing the UI by modifying `src/app/page.tsx` and the components under `src/components/text-to-image/`.

API routes are under `/api/replicate/*` and handle polling + generation:
- `src/app/api/replicate/generate-image/route.ts` creates a prediction
- `src/app/api/replicate/predictions/[predictionId]/route.ts` polls prediction progress/output

Generated images are stored locally in your browser (localStorage) for the paginated history/gallery.

Learn More
To learn more about Next.js, take a look at the following resources:

Next.js Documentation - learn about Next.js features and API.
Learn Next.js - an interactive Next.js tutorial.
Productionizing your Next App
To make your next App run smoothly in production make sure to deploy your project with Repl Deployments!

You can also produce a production build by running npm run build and changing the run command to npm run start.