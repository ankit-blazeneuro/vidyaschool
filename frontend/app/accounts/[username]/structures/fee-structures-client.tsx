"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  Settings,
  Layers,
  HelpCircle,
  Loader2,
  TrendingUp,
} from "lucide-react"

interface FeeComponent {
  id: string
  name: string
  amount: number
  billingPeriod: "Monthly" | "Quarterly" | "Annually"
}

interface ClassStructure {
  id: string
  sectionName: string
  classes: string
  components: FeeComponent[]
}

const INITIAL_STRUCTURES: ClassStructure[] = [
  {
    id: "sec-1",
    sectionName: "Primary Wing",
    classes: "Classes 1 to 5",
    components: [
      { id: "comp-1-1", name: "Tuition Fee", amount: 8000, billingPeriod: "Monthly" },
      { id: "comp-1-2", name: "Co-Curricular Activities", amount: 1500, billingPeriod: "Monthly" },
      { id: "comp-1-3", name: "Library & Computing Access", amount: 500, billingPeriod: "Monthly" },
      { id: "comp-1-4", name: "Examination Fee", amount: 1200, billingPeriod: "Quarterly" },
      { id: "comp-1-5", name: "School Transport System", amount: 2000, billingPeriod: "Monthly" },
    ],
  },
  {
    id: "sec-2",
    sectionName: "Middle Wing",
    classes: "Classes 6 to 8",
    components: [
      { id: "comp-2-1", name: "Tuition Fee", amount: 10000, billingPeriod: "Monthly" },
      { id: "comp-2-2", name: "Practical Lab Charges", amount: 1000, billingPeriod: "Monthly" },
      { id: "comp-2-3", name: "Co-Curricular Activities", amount: 1500, billingPeriod: "Monthly" },
      { id: "comp-2-4", name: "Library & Computing Access", amount: 500, billingPeriod: "Monthly" },
      { id: "comp-2-5", name: "Examination Fee", amount: 1500, billingPeriod: "Quarterly" },
      { id: "comp-2-6", name: "School Transport System", amount: 2000, billingPeriod: "Monthly" },
    ],
  },
  {
    id: "sec-3",
    sectionName: "Secondary Wing",
    classes: "Classes 9 and 10",
    components: [
      { id: "comp-3-1", name: "Tuition Fee", amount: 12000, billingPeriod: "Monthly" },
      { id: "comp-3-2", name: "Science Laboratory Fee", amount: 2000, billingPeriod: "Monthly" },
      { id: "comp-3-3", name: "Library & Computing Access", amount: 800, billingPeriod: "Monthly" },
      { id: "comp-3-4", name: "Co-Curricular Activities", amount: 1500, billingPeriod: "Monthly" },
      { id: "comp-3-5", name: "Examination & Assessment Fee", amount: 1800, billingPeriod: "Quarterly" },
      { id: "comp-3-6", name: "School Transport System", amount: 2500, billingPeriod: "Monthly" },
    ],
  },
  {
    id: "sec-4",
    sectionName: "Senior Secondary Wing",
    classes: "Classes 11 and 12",
    components: [
      { id: "comp-4-1", name: "Tuition Fee", amount: 15000, billingPeriod: "Monthly" },
      { id: "comp-4-2", name: "Advanced Science/CS Labs", amount: 3000, billingPeriod: "Monthly" },
      { id: "comp-4-3", name: "Library & Computing Access", amount: 800, billingPeriod: "Monthly" },
      { id: "comp-4-4", name: "Career Counseling & Mentoring", amount: 1000, billingPeriod: "Monthly" },
      { id: "comp-4-5", name: "Examination Fee", amount: 2000, billingPeriod: "Quarterly" },
      { id: "comp-4-6", name: "School Transport System", amount: 2500, billingPeriod: "Monthly" },
    ],
  },
]

function formatCurrency(value?: number) {
  return `₹${(value ?? 0).toLocaleString("en-IN")}`
}

export function FeeStructuresClient({ username }: { username: string }) {
  const [structures, setStructures] = useState<ClassStructure[]>(INITIAL_STRUCTURES)
  const [activeTab, setActiveTab] = useState(INITIAL_STRUCTURES[0].id)
  
  // Modal states
  const [addComponentOpen, setAddComponentOpen] = useState(false)
  const [editComponentOpen, setEditComponentOpen] = useState(false)
  const [applyStructureOpen, setApplyStructureOpen] = useState(false)

  // Target item details
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null)

  // Component form states
  const [compName, setCompName] = useState("")
  const [compAmount, setCompAmount] = useState("")
  const [compPeriod, setCompPeriod] = useState<"Monthly" | "Quarterly" | "Annually">("Monthly")

  // Simulator state
  const [isApplying, setIsApplying] = useState(false)
  const [targetClassRange, setTargetClassRange] = useState("all")

  const activeStructure = structures.find((s) => s.id === activeTab) || structures[0]

  // Calculate sum of active structure components
  const activeStructureTotal = activeStructure.components.reduce(
    (sum, comp) => sum + (comp.billingPeriod === "Monthly" ? comp.amount : comp.amount / 3), // Normalise quarterly
    0
  )

  const handleAddComponentClick = () => {
    setCompName("")
    setCompAmount("")
    setCompPeriod("Monthly")
    setAddComponentOpen(true)
  }

  // Create component
  const handleAddComponentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(compAmount)
    
    if (!compName.trim()) {
      toast.error("Component name is required")
      return
    }
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid amount greater than 0")
      return
    }

    const newComp: FeeComponent = {
      id: `comp-${Date.now()}`,
      name: compName,
      amount: amt,
      billingPeriod: compPeriod,
    }

    setStructures((prev) =>
      prev.map((struct) => {
        if (struct.id === activeTab) {
          return {
            ...struct,
            components: [...struct.components, newComp],
          }
        }
        return struct
      })
    )

    toast.success(`Fee component "${compName}" added to ${activeStructure.sectionName}`)
    setAddComponentOpen(false)
  }

  const handleEditComponentClick = (comp: FeeComponent) => {
    setSelectedCompId(comp.id)
    setCompName(comp.name)
    setCompAmount(comp.amount.toString())
    setCompPeriod(comp.billingPeriod)
    setEditComponentOpen(true)
  }

  // Update component
  const handleEditComponentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(compAmount)

    if (!compName.trim()) {
      toast.error("Component name is required")
      return
    }
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid amount greater than 0")
      return
    }

    setStructures((prev) =>
      prev.map((struct) => {
        if (struct.id === activeTab) {
          return {
            ...struct,
            components: struct.components.map((c) =>
              c.id === selectedCompId ? { ...c, name: compName, amount: amt, billingPeriod: compPeriod } : c
            ),
          }
        }
        return struct
      })
    )

    toast.success(`Fee component updated!`)
    setEditComponentOpen(false)
    setSelectedCompId(null)
  }

  // Delete component
  const handleDeleteComponent = (compId: string, name: string) => {
    setStructures((prev) =>
      prev.map((struct) => {
        if (struct.id === activeTab) {
          return {
            ...struct,
            components: struct.components.filter((c) => c.id !== compId),
          }
        }
        return struct
      })
    )
    toast.warning(`Removed "${name}" from fee setup`)
  }

  // Simulate applying setup to student accounts
  const handleApplyStructure = () => {
    setTargetClassRange(activeStructure.classes)
    setApplyStructureOpen(true)
  }

  const handleConfirmApply = (e: React.FormEvent) => {
    e.preventDefault()
    setIsApplying(true)

    setTimeout(() => {
      setIsApplying(false)
      setApplyStructureOpen(false)
      toast.success(`Allocated "${activeStructure.sectionName}" fee structures to database records!`, {
        description: `Applicable installments generated for students matching ${targetClassRange}.`,
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      })
    }, 2000)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0 md:p-6 md:pt-0">
      <Toaster />

      {/* Header Panel */}
      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm relative overflow-hidden md:flex-row md:items-center md:justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1.5 z-10">
          <h1 className="text-2xl font-bold tracking-tight">Academic Fee Structures</h1>
          <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Configure fee structures by grade levels and allocate structural billing components directly.
          </p>
        </div>
        <div className="flex gap-2.5 z-10">
          <Button size="sm" onClick={handleAddComponentClick} className="gap-1.5 shadow-xs font-semibold">
            <Plus className="size-4" /> Add Component
          </Button>
          <Button size="sm" variant="outline" onClick={handleApplyStructure} className="gap-1.5 font-semibold bg-background">
            <FileCheck className="size-4" /> Apply Setup
          </Button>
        </div>
      </section>

      {/* Main Configuration Card */}
      <div className="grid gap-6 md:grid-cols-[1fr_2.5fr]">
        
        {/* Left Side: Wing selector list */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Tiers & Sections</p>
          {structures.map((struct) => {
            const isSelected = activeTab === struct.id
            const sumMonthlies = struct.components.reduce((sum, comp) => sum + comp.amount, 0)
            
            return (
              <div
                key={struct.id}
                onClick={() => setActiveTab(struct.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? "bg-card border-primary shadow-xs ring-1 ring-primary/20" 
                    : "bg-muted/10 hover:bg-muted/30 border-muted-foreground/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {struct.sectionName}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-medium">
                    {struct.components.length} Items
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{struct.classes}</p>
                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-muted-foreground border-t pt-2.5 border-dashed">
                  <span>Est. Monthly sum</span>
                  <span className="text-foreground">{formatCurrency(sumMonthlies)}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right Side: Detailed Component View */}
        <Card className="shadow-xs">
          <CardHeader className="border-b pb-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Layers className="size-4 text-primary" /> {activeStructure.sectionName} Allocation Ledger
                </CardTitle>
                <CardDescription className="text-xs">
                  Fee structures allocated to students enrolled in <span className="font-semibold text-foreground">{activeStructure.classes}</span>.
                </CardDescription>
              </div>
              <div className="text-xs font-semibold px-3 py-1.5 rounded-lg border bg-muted/20">
                Normalized Monthly Total: <span className="text-emerald-600 font-bold ml-1">{formatCurrency(Math.round(activeStructureTotal))}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-semibold text-xs py-3 pl-6">Fee Component Name</TableHead>
                    <TableHead className="font-semibold text-xs py-3">Billing Cycle</TableHead>
                    <TableHead className="font-semibold text-xs py-3 text-right">Amount</TableHead>
                    <TableHead className="font-semibold text-xs py-3 pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeStructure.components.map((comp) => (
                    <TableRow key={comp.id} className="hover:bg-muted/10">
                      <TableCell className="font-medium text-sm py-3 pl-6">
                        {comp.name}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="secondary" className="text-[10px] py-0 px-2 font-medium">
                          {comp.billingPeriod}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right font-bold tabular-nums">
                        {formatCurrency(comp.amount)}
                      </TableCell>
                      <TableCell className="py-3 text-right pr-6 space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditComponentClick(comp)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Edit component"
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteComponent(comp.id, comp.name)}
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          title="Delete component"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog: Add Component */}
      <Dialog open={addComponentOpen} onOpenChange={setAddComponentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Fee Component</DialogTitle>
            <DialogDescription>
              Create a new item configuration for {activeStructure.sectionName}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddComponentSubmit} className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="compName">Component Name</Label>
              <Input
                id="compName"
                value={compName}
                onChange={(e) => setCompName(e.target.value)}
                placeholder="e.g. Science Laboratory Fee"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="compAmount">Amount (INR)</Label>
                <Input
                  id="compAmount"
                  type="number"
                  value={compAmount}
                  onChange={(e) => setCompAmount(e.target.value)}
                  placeholder="₹ 2000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="compPeriod">Billing Cycle</Label>
                <Select value={compPeriod} onValueChange={(val: any) => setCompPeriod(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAddComponentOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Component</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Edit Component */}
      <Dialog open={editComponentOpen} onOpenChange={setEditComponentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Fee Component</DialogTitle>
            <DialogDescription>
              Modify pricing parameters for this component.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditComponentSubmit} className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="editCompName">Component Name</Label>
              <Input
                id="editCompName"
                value={compName}
                onChange={(e) => setCompName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="editCompAmount">Amount (INR)</Label>
                <Input
                  id="editCompAmount"
                  type="number"
                  value={compAmount}
                  onChange={(e) => setCompAmount(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editCompPeriod">Billing Cycle</Label>
                <Select value={compPeriod} onValueChange={(val: any) => setCompPeriod(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setEditComponentOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Apply Setup Confirmation */}
      <Dialog open={applyStructureOpen} onOpenChange={setApplyStructureOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply Fee Structures Setup</DialogTitle>
            <DialogDescription>
              This will allocate and generate fee installments for students according to class brackets.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConfirmApply} className="space-y-4 pt-2">
            <div className="bg-amber-500/5 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 p-3.5 border border-amber-500/20 rounded-xl text-xs flex gap-2.5">
              <AlertCircle className="size-5 shrink-0" />
              <div className="space-y-1 leading-relaxed">
                <p className="font-semibold">Confirm Action</p>
                <p>
                  Applying will generate structural monthly ledger balances. Pre-existing records for the active period will be preserved.
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="targetClasses">Target Student Group Bracket</Label>
              <Select value={targetClassRange} onValueChange={setTargetClassRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={activeStructure.classes}>Enrolled in {activeStructure.classes} (Current Active)</SelectItem>
                  <SelectItem value="all">Apply Globally (All classes 1 to 12)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setApplyStructureOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isApplying} className="gap-1.5">
                {isApplying && <Loader2 className="size-4 animate-spin" />}
                Confirm & Generate Invoices
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
