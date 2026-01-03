# FindBuild - Construction Materials Marketplace

A modern construction materials marketplace for Mauritius built with Next.js 14, TypeScript, and MongoDB.

## Features

- 🏗️ Product catalog with categories
- 🏪 Store listings and profiles
- 🔧 Service provider directory
- 🛒 Shopping cart functionality
- 🔍 Advanced search and filters
- 📱 Mobile-responsive design
- 🌍 Multi-language support (English, French, Creole)

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Auth**: NextAuth.js
- **Animations**: Framer Motion
- **i18n**: next-intl

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database (local or Atlas)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/                 # Next.js app router pages
├── components/          # React components
│   ├── home/           # Homepage components
│   ├── products/       # Product-related components
│   ├── layout/         # Layout components
│   └── ui/             # shadcn/ui components
├── lib/                # Utility functions
├── models/             # Mongoose models
└── public/             # Static assets
```

## Database Models

- User
- Store
- Product
- Category
- Service
- Order
- Review
- Cart
- Favorite

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT

