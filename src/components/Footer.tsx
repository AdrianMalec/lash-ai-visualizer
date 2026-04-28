export const Footer = () => (
  <footer className="border-t border-border py-12">
    <div className="container flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-2xl text-gold tracking-wider">LASHIQUE</span>
        <span className="text-[10px] tracking-[0.4em] text-muted-foreground uppercase">studio</span>
      </div>
      <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
        © 2026 Lashique — AI Beauty
      </p>
      <div className="flex gap-6 text-xs tracking-[0.2em] text-muted-foreground uppercase">
        <a href="#" className="hover:text-primary transition-luxe">Instagram</a>
        <a href="#" className="hover:text-primary transition-luxe">TikTok</a>
        <a href="#" className="hover:text-primary transition-luxe">Pinterest</a>
      </div>
    </div>
  </footer>
);
