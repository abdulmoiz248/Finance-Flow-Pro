"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, Home, TrendingUp, CreditCard, PieChart, FileText, Settings, Target, Activity } from "lucide-react"
import { motion } from "framer-motion"

interface MobileNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, color: "text-blue-600" },
    { id: "analytics", label: "Analytics", icon: TrendingUp, color: "text-purple-600" },
    { id: "transactions", label: "Transactions", icon: CreditCard, color: "text-green-600" },
    { id: "mutual-funds", label: "Investments", icon: PieChart, color: "text-orange-600" },
    { id: "goals", label: "Goals", icon: Target, color: "text-indigo-600" },
    { id: "invoices", label: "Invoices", icon: FileText, color: "text-pink-600" },
  ]

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <h2 className="text-xl font-bold">FinanceFlow Pro</h2>
              <p className="text-sm opacity-90">Your Financial Hub</p>
            </div>

            {/* Navigation */}
            <div className="flex-1 p-4 space-y-2">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => {
                    onTabChange(item.id)
                    setOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                    activeTab === item.id
                      ? "bg-blue-50 text-blue-600 border border-blue-200"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${activeTab === item.id ? item.color : "text-gray-500"}`} />
                  <span className="font-medium">{item.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  onTabChange("settings")
                  setOpen(false)
                }}
              >
                <Settings className="h-4 w-4 mr-3" />
                Settings
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
