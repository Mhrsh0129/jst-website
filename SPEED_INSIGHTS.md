# Getting started with Speed Insights

This guide will help you get started with using Vercel Speed Insights on your project, showing you how to enable it, add the package to your project, deploy your app to Vercel, and view your data in the dashboard.

To view instructions on using the Vercel Speed Insights in your project for your framework, use the **Choose a framework** dropdown on the right (at the bottom in mobile view).

## Prerequisites

- A Vercel account. If you don't have one, you can [sign up for free](https://vercel.com/signup).
- A Vercel project. If you don't have one, you can [create a new project](https://vercel.com/new).
- The Vercel CLI installed. If you don't have it, you can install it using the following command:

```bash
# Using pnpm
pnpm i vercel

# Using yarn
yarn add vercel

# Using npm
npm install vercel

# Using bun
bun add vercel
```

## Setup Steps

### 1. Enable Speed Insights in Vercel

On the [Vercel dashboard](/dashboard), select your Project followed by the **Speed Insights** tab. You can also select the button below to be taken there. Then, select **Enable** from the dialog.

> **💡 Note:** Enabling Speed Insights will add new routes (scoped at `/_vercel/speed-insights/*`) after your next deployment.

### 2. Add `@vercel/speed-insights` to your project

Using the package manager of your choice, add the `@vercel/speed-insights` package to your project:

```bash
# Using pnpm
pnpm add @vercel/speed-insights

# Using yarn
yarn add @vercel/speed-insights

# Using npm
npm install @vercel/speed-insights

# Using bun
bun add @vercel/speed-insights
```

### 3. Add the `SpeedInsights` component to your app

For a React application with Vite (like this project), add the `SpeedInsights` component to your main app file:

```tsx
// src/App.tsx
import { SpeedInsights } from "@vercel/speed-insights/react";

export default function App() {
  return (
    <div>
      {/* ... your app components ... */}
      <SpeedInsights />
    </div>
  );
}
```

The `SpeedInsights` component is a wrapper around the tracking script, offering more seamless integration with React.

### 4. Deploy your app to Vercel

You can deploy your app to Vercel's global [CDN](/docs/cdn) by running the following command from your terminal:

```bash
vercel deploy
```

Alternatively, you can [connect your project's git repository](/docs/git#deploying-a-git-repository), which will enable Vercel to deploy your latest pushes and merges to main.

Once your app is deployed, it's ready to begin tracking performance metrics.

> **💡 Note:** If everything is set up correctly, you should be able to find the `/_vercel/speed-insights/script.js` script inside the body tag of your page.

### 5. View your data in the dashboard

Once your app is deployed, and users have visited your site, you can view the data in the dashboard.

To do so, go to your [dashboard](/dashboard), select your project, and click the **Speed Insights** tab.

After a few days of visitors, you'll be able to start exploring your metrics. For more information on how to use Speed Insights, see [Using Speed Insights](/docs/speed-insights/using-speed-insights).

## Current Implementation

This project has already been set up with Vercel Speed Insights. The `@vercel/speed-insights` package is included in the dependencies, and the `SpeedInsights` component has been integrated into the main `App.tsx` component.

### Files Modified:
- **src/App.tsx** - Added SpeedInsights component import and included it in the component tree

The SpeedInsights component is placed at the end of the App component to ensure it tracks all routes and pages throughout the application.

## Privacy and Compliance

Learn more about how Vercel supports [privacy and data compliance standards](/docs/speed-insights/privacy-policy) with Vercel Speed Insights.

## Next Steps

Now that you have Vercel Speed Insights set up, you can explore the following topics to learn more:

- [Learn how to use the `@vercel/speed-insights` package](/docs/speed-insights/package)
- [Learn about metrics](/docs/speed-insights/metrics)
- [Read about privacy and compliance](/docs/speed-insights/privacy-policy)
- [Explore pricing](/docs/speed-insights/limits-and-pricing)
- [Troubleshooting](/docs/speed-insights/troubleshooting)

## Monitoring Performance

Speed Insights provides valuable data about your application's performance:

- **Core Web Vitals** - Measures loading performance, responsiveness, and visual stability
- **Real User Monitoring (RUM)** - Collects actual performance data from your users' browsers
- **Historical Data** - Track performance improvements over time

After deployment, check the Vercel dashboard regularly to monitor your application's performance metrics and identify areas for optimization.
