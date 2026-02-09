export function Footer() {
  return (
    <footer className="border-t bg-muted/50 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold mb-4">Academia</h3>
            <p className="text-sm text-muted-foreground">
              Streamlining academic project management for universities worldwide.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/features" className="hover:text-primary">Features</a></li>
              <li><a href="/pricing" className="hover:text-primary">Pricing</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/about" className="hover:text-primary">About</a></li>
              <li><a href="/contact" className="hover:text-primary">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/privacy" className="hover:text-primary">Privacy</a></li>
              <li><a href="/terms" className="hover:text-primary">Terms</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          © 2026 Academia. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
