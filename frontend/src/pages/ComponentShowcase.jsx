import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Badge } from '../components/ui/Badge';

function ComponentShowcase() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Shadcn/ui Component Showcase</h1>
          <p className="text-muted-foreground">
            Preview of all new minimalist components for RentEase
          </p>
        </div>

        {/* Buttons Section */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Different button variants and sizes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">🏠</Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button disabled>Disabled</Button>
              <Button variant="outline" disabled>Disabled Outline</Button>
            </div>
          </CardContent>
        </Card>

        {/* Badges Section */}
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardDescription>Status indicators and labels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="success">✓ Available</Badge>
              <Badge variant="warning">⚠ Pending</Badge>
              <Badge variant="danger">✕ Overdue</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Form Section */}
        <Card>
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
            <CardDescription>Inputs, labels, and form controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="john@example.com" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="09171234567" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button>Save Changes</Button>
          </CardFooter>
        </Card>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Rooms</CardTitle>
              <CardDescription>Active listings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">24</div>
              <p className="text-sm text-muted-foreground mt-2">
                +2 from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Occupancy Rate</CardTitle>
              <CardDescription>Current status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">87.5%</div>
              <p className="text-sm text-muted-foreground mt-2">
                21 of 24 rooms occupied
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
              <CardDescription>This month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₱125,000</div>
              <p className="text-sm text-muted-foreground mt-2">
                +12% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Property Card Example */}
        <Card className="overflow-hidden">
          <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <span className="text-4xl">🏠</span>
          </div>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Deluxe Single Room</CardTitle>
                <CardDescription>Near University Campus</CardDescription>
              </div>
              <Badge variant="success">Available</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">₱5,000</span>
                <span className="text-sm text-muted-foreground">per month</span>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Spacious single room with private bathroom, air conditioning, 
                and high-speed WiFi. Perfect for students.
              </p>
              
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span>👤</span>
                  <span>1 person</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>📏</span>
                  <span>15 sqm</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🛏️</span>
                  <span>Single bed</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" className="flex-1">View Details</Button>
            <Button className="flex-1">Book Now</Button>
          </CardFooter>
        </Card>

        {/* Table Example */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Latest payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium">Date</th>
                    <th className="p-3 text-left text-sm font-medium">Tenant</th>
                    <th className="p-3 text-left text-sm font-medium">Amount</th>
                    <th className="p-3 text-left text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t hover:bg-muted/50">
                    <td className="p-3 text-sm">Jan 15, 2024</td>
                    <td className="p-3 text-sm">John Doe</td>
                    <td className="p-3 text-sm font-medium">₱5,000</td>
                    <td className="p-3">
                      <Badge variant="success">Paid</Badge>
                    </td>
                  </tr>
                  <tr className="border-t hover:bg-muted/50">
                    <td className="p-3 text-sm">Jan 14, 2024</td>
                    <td className="p-3 text-sm">Jane Smith</td>
                    <td className="p-3 text-sm font-medium">₱6,500</td>
                    <td className="p-3">
                      <Badge variant="warning">Pending</Badge>
                    </td>
                  </tr>
                  <tr className="border-t hover:bg-muted/50">
                    <td className="p-3 text-sm">Jan 10, 2024</td>
                    <td className="p-3 text-sm">Bob Johnson</td>
                    <td className="p-3 text-sm font-medium">₱5,500</td>
                    <td className="p-3">
                      <Badge variant="danger">Overdue</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardDescription>Current theme colors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-primary"></div>
                <p className="text-sm font-medium">Primary</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-secondary"></div>
                <p className="text-sm font-medium">Secondary</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-muted"></div>
                <p className="text-sm font-medium">Muted</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-destructive"></div>
                <p className="text-sm font-medium">Destructive</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                🎨 Powered by Shadcn/ui + Tailwind CSS
              </p>
              <p className="text-xs text-muted-foreground">
                Minimalist design system for RentEase Boarding House Management
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ComponentShowcase;
