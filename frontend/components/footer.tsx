"use client"

import * as React from "react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-background py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          
          {/* Column 1: Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 font-semibold text-sm tracking-tight text-foreground hover:opacity-90">
              <span className="font-semibold text-sm">Antigravity</span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Advanced agentic coding environment built on the Model Context Protocol. Designed by the Google DeepMind team.
            </p>
          </div>

          {/* Column 2: Products */}
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Products</h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link href="/products/app" className="hover:text-foreground transition-colors">Antigravity 2.0</Link>
              </li>
              <li>
                <Link href="/products/ide" className="hover:text-foreground transition-colors">IDE</Link>
              </li>
              <li>
                <Link href="/products/cli" className="hover:text-foreground transition-colors">Terminal & CLI</Link>
              </li>
              <li>
                <Link href="/products/sdk" className="hover:text-foreground transition-colors">SDK</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Documentation */}
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Documentation</h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link href="/docs/skills" className="hover:text-foreground transition-colors">Skills</Link>
              </li>
              <li>
                <Link href="/docs/rules" className="hover:text-foreground transition-colors">Rules</Link>
              </li>
              <li>
                <Link href="/docs/mcp" className="hover:text-foreground transition-colors">Model Context Protocol</Link>
              </li>
              <li>
                <Link href="/docs/browser" className="hover:text-foreground transition-colors">Browser Control</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Resources & Support */}
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Resources</h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link href="/docs/agent-permissions" className="hover:text-foreground transition-colors">Permissions</Link>
              </li>
              <li>
                <Link href="/changelog" className="hover:text-foreground transition-colors">Changelog</Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-foreground transition-colors">Support</Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Giant Footer Watermark */}
        <div className="mt-16 md:mt-24 select-none">
          <h2 className="text-center font-bold tracking-tighter text-foreground/20 dark:text-foreground/10 text-4xl sm:text-6xl md:text-[8rem] lg:text-[10rem] xl:text-[12rem] leading-none">
            Vidya School
          </h2>
        </div>

        {/* Bottom copyright section */}
        <div className="border-t border-border mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[11px] text-muted-foreground">
            &copy; {new Date().getFullYear()} Google Antigravity. All rights reserved.
          </div>
          <div className="flex gap-4 text-[11px] text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
