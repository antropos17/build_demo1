import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">FindBuild</h3>
            <p className="text-sm text-muted-foreground">
              Your trusted marketplace for construction materials and services
              in Mauritius.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/products"
                  className="text-muted-foreground hover:text-foreground"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/stores"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Stores
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Services
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Account</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/auth/login"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/register"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Register
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/orders"
                  className="text-muted-foreground hover:text-foreground"
                >
                  My Orders
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/favorites"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Favorites
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-foreground"
                >
                  About
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2024 FindBuild. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

