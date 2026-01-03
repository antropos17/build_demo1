# Quick Start Guide

## Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/findbuild
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## What's Included

✅ Next.js 14 with App Router  
✅ TypeScript configuration  
✅ Tailwind CSS with custom theme  
✅ shadcn/ui components (Button, Card, Input, Badge, Select, Label)  
✅ MongoDB connection setup  
✅ Mongoose models (User, Store, Product, Category)  
✅ Homepage with hero, categories, featured products  
✅ Product listing page with filters  
✅ Responsive layout with Header and Footer  
✅ Framer Motion animations  
✅ Placeholder data for development  

## Next Steps

1. Set up MongoDB database (local or Atlas)
2. Configure NextAuth.js for authentication
3. Add image upload functionality (Cloudinary/UploadThing)
4. Implement cart functionality
5. Add product detail pages
6. Set up store pages
7. Implement search functionality

## Project Structure

- `app/` - Next.js pages and routes
- `components/` - React components
  - `home/` - Homepage sections
  - `products/` - Product-related components
  - `layout/` - Header, Footer
  - `ui/` - Reusable UI components
- `lib/` - Utility functions and database connection
- `models/` - Mongoose schemas

## Notes

- All linting errors will resolve after running `npm install`
- The project uses placeholder data initially
- MongoDB connection is configured but requires a running MongoDB instance
- NextAuth.js structure is ready but needs configuration

