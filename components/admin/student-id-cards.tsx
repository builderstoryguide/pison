"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Users, 
  Download, 
  Upload, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Printer,
  QrCode,
  CreditCard,
  Calendar,
  MapPin,
  Phone,
  Mail,
  GraduationCap,
  School,
  User,
  Settings,
  Plus,
  RefreshCw,
  FileText,
  Image,
  Palette,
  Type,
  Layout,
  CheckCircle,
  AlertCircle,
  Copy
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function StudentIdCards() {
  const [selectedTab, setSelectedTab] = useState("generate")
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [cardTemplate, setCardTemplate] = useState("default")
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterClass, setFilterClass] = useState("all")

  // Mock data for demonstration
  const students = [
    {
      id: "STU001",
      name: "John Doe",
      class: "Grade 10A",
      studentId: "2024-001",
      photo: "/avatars/john-doe.jpg",
      dateOfBirth: "2008-05-15",
      address: "123 Main St, City, State",
      phone: "+1 (555) 123-4567",
      email: "john.doe@school.edu",
      parentName: "Jane Doe",
      parentPhone: "+1 (555) 987-6543",
      bloodGroup: "O+",
      emergencyContact: "+1 (555) 456-7890",
      issueDate: "2024-01-15",
      expiryDate: "2025-01-15",
      status: "active"
    },
    {
      id: "STU002",
      name: "Sarah Johnson",
      class: "Grade 11B",
      studentId: "2024-002",
      photo: "/avatars/sarah-johnson.jpg",
      dateOfBirth: "2007-08-22",
      address: "456 Oak Ave, City, State",
      phone: "+1 (555) 234-5678",
      email: "sarah.johnson@school.edu",
      parentName: "Michael Johnson",
      parentPhone: "+1 (555) 876-5432",
      bloodGroup: "A+",
      emergencyContact: "+1 (555) 345-6789",
      issueDate: "2024-01-15",
      expiryDate: "2025-01-15",
      status: "active"
    },
    {
      id: "STU003",
      name: "Michael Brown",
      class: "Grade 9C",
      studentId: "2024-003",
      photo: "/avatars/michael-brown.jpg",
      dateOfBirth: "2009-03-10",
      address: "789 Pine St, City, State",
      phone: "+1 (555) 345-6789",
      email: "michael.brown@school.edu",
      parentName: "Lisa Brown",
      parentPhone: "+1 (555) 765-4321",
      bloodGroup: "B+",
      emergencyContact: "+1 (555) 234-5678",
      issueDate: "2024-01-15",
      expiryDate: "2025-01-15",
      status: "active"
    },
    {
      id: "STU004",
      name: "Emily Davis",
      class: "Grade 12A",
      studentId: "2024-004",
      photo: "/avatars/emily-davis.jpg",
      dateOfBirth: "2006-11-05",
      address: "321 Elm St, City, State",
      phone: "+1 (555) 456-7890",
      email: "emily.davis@school.edu",
      parentName: "Robert Davis",
      parentPhone: "+1 (555) 654-3210",
      bloodGroup: "AB+",
      emergencyContact: "+1 (555) 123-4567",
      issueDate: "2024-01-15",
      expiryDate: "2025-01-15",
      status: "active"
    }
  ]

  const classes = [
    { id: "grade-9", name: "Grade 9", count: 45 },
    { id: "grade-10", name: "Grade 10", count: 52 },
    { id: "grade-11", name: "Grade 11", count: 48 },
    { id: "grade-12", name: "Grade 12", count: 55 }
  ]

  const cardTemplates = [
    { id: "default", name: "Default Template", description: "Standard school ID card design" },
    { id: "modern", name: "Modern Template", description: "Contemporary design with gradients" },
    { id: "minimal", name: "Minimal Template", description: "Clean and simple design" },
    { id: "colorful", name: "Colorful Template", description: "Vibrant colors for younger students" }
  ]

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.class.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = filterClass === "all" || student.class.toLowerCase().includes(filterClass)
    return matchesSearch && matchesClass
  })

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(filteredStudents.map(student => student.id))
    }
  }

  const generateIdCards = () => {
    console.log("Generating ID cards for:", selectedStudents)
    // TODO: Implement actual ID card generation logic
  }

  const previewIdCard = (student: any) => {
    return (
      <div className="w-80 h-48 bg-white border-2 border-gray-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-center gap-4 h-full">
          <div className="flex-shrink-0">
            <Avatar className="h-20 w-20 border-2 border-blue-500">
              <AvatarImage src={student.photo} alt={student.name} />
              <AvatarFallback className="text-lg">
                {student.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{student.name}</h3>
              <QrCode className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600">Student ID: {student.studentId}</p>
            <p className="text-sm text-gray-600">{student.class}</p>
            <div className="flex items-center gap-2 mt-2">
              <School className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-600">School Name</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Valid: {student.issueDate} - {student.expiryDate}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student ID Cards</h1>
          <p className="text-muted-foreground">
            Generate and manage student identification cards
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Card Settings
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Photos
          </Button>
          <Button onClick={generateIdCards} disabled={selectedStudents.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Generate Cards ({selectedStudents.length})
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              +5 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cards Generated</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              100% coverage
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cards</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.filter(s => s.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              Valid and current
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Next 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">Generate Cards</TabsTrigger>
          <TabsTrigger value="templates">Card Templates</TabsTrigger>
          <TabsTrigger value="history">Card History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Select Students</CardTitle>
                  <CardDescription>
                    Choose students to generate ID cards for
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Search students..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={filterClass} onValueChange={setFilterClass}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    <div className="flex items-center space-x-2 p-2 border rounded-md">
                      <Checkbox
                        id="select-all"
                        checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <Label htmlFor="select-all" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Select All ({filteredStudents.length})</span>
                          <Badge variant="outline">{selectedStudents.length} selected</Badge>
                        </div>
                      </Label>
                    </div>
                    
                    {filteredStudents.map((student) => (
                      <div key={student.id} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50">
                        <Checkbox
                          id={student.id}
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() => handleStudentSelect(student.id)}
                        />
                        <Label htmlFor={student.id} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student.photo} alt={student.name} />
                              <AvatarFallback className="text-xs">
                                {student.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{student.name}</span>
                                <Badge variant="outline">{student.class}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                ID: {student.studentId}
                              </p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Card Template</CardTitle>
                  <CardDescription>
                    Choose the design template for the ID cards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cardTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          cardTemplate === template.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setCardTemplate(template.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 border-2 border-gray-300 rounded-full flex items-center justify-center">
                            {cardTemplate === template.id && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-xs text-muted-foreground">{template.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Card Preview</CardTitle>
                  <CardDescription>
                    Preview of the selected template
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    {previewIdCard(students[0])}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => setIsPreviewOpen(true)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview All Templates
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Generation Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Output Format</Label>
                    <Select defaultValue="pdf">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="png">PNG Images</SelectItem>
                        <SelectItem value="jpg">JPG Images</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Card Size</Label>
                    <Select defaultValue="standard">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard (85.6 x 54 mm)</SelectItem>
                        <SelectItem value="large">Large (105 x 74 mm)</SelectItem>
                        <SelectItem value="small">Small (66 x 42 mm)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="include-qr" defaultChecked />
                    <Label htmlFor="include-qr" className="text-sm">
                      Include QR Code
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="include-barcode" />
                    <Label htmlFor="include-barcode" className="text-sm">
                      Include Barcode
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Card Templates</h3>
              <p className="text-sm text-muted-foreground">
                Manage and customize ID card templates
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cardTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Template
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[85.6/54] bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center mb-4">
                    <div className="text-center text-gray-500">
                      <Layout className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Template Preview</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Card Generation History</h3>
              <p className="text-sm text-muted-foreground">
                Track all ID card generation activities
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={student.photo} alt={student.name} />
                        <AvatarFallback>
                          {student.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{student.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {student.class} • ID: {student.studentId}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">Generated</p>
                        <p className="text-xs text-muted-foreground">{student.issueDate}</p>
                      </div>
                      <Badge variant="default">Active</Badge>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Template Previews</DialogTitle>
            <DialogDescription>
              Preview all available card templates
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            {cardTemplates.map((template) => (
              <div key={template.id} className="space-y-2">
                <h4 className="font-medium">{template.name}</h4>
                <div className="flex justify-center">
                  {previewIdCard(students[0])}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
            <Button onClick={() => setIsPreviewOpen(false)}>
              Select Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
