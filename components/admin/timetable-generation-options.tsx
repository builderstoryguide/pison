"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, Settings, Save, Undo, Coffee } from 'lucide-react'

export interface TimetableGenerationParams {
  // Time settings
  schoolStartTime: string;
  schoolEndTime: string;
  periodDuration: number;
  breakDuration: number;
  
  // Lunch break settings
  includeLunchBreak: boolean;
  lunchBreakStartTime: string;
  lunchBreakDuration: number;
  
  // Days and periods
  daysPerWeek: number;
  periodsPerDay: number;
  
  // Custom periods per day
  customPeriodsPerDay: boolean;
  mondayPeriods: number;
  tuesdayPeriods: number;
  wednesdayPeriods: number;
  thursdayPeriods: number;
  fridayPeriods: number;
  saturdayPeriods: number;
}

interface TimetableGenerationOptionsProps {
  onSave: (params: TimetableGenerationParams) => void;
  onCancel: () => void;
  initialParams?: Partial<TimetableGenerationParams>;
}

const defaultParams: TimetableGenerationParams = {
  schoolStartTime: '08:00',
  schoolEndTime: '17:00',
  periodDuration: 45,
  breakDuration: 15,
  
  includeLunchBreak: true,
  lunchBreakStartTime: '12:30',
  lunchBreakDuration: 45,
  
  daysPerWeek: 5,
  periodsPerDay: 8,
  
  customPeriodsPerDay: false,
  mondayPeriods: 8,
  tuesdayPeriods: 8,
  wednesdayPeriods: 8,
  thursdayPeriods: 8,
  fridayPeriods: 8,
  saturdayPeriods: 4
}

export function TimetableGenerationOptions({ 
  onSave, 
  onCancel,
  initialParams = {} 
}: TimetableGenerationOptionsProps) {
  const [params, setParams] = useState<TimetableGenerationParams>({
    ...defaultParams,
    ...initialParams
  })

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const displayedDays = daysOfWeek.slice(0, params.daysPerWeek)

  const handleChange = <K extends keyof TimetableGenerationParams>(
    key: K, 
    value: TimetableGenerationParams[K]
  ) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    onSave(params)
  }

  const handleReset = () => {
    setParams(defaultParams)
  }

  // Calculate total school hours based on settings
  const calculateTotalHours = () => {
    const startTime = params.schoolStartTime.split(':').map(Number)
    const endTime = params.schoolEndTime.split(':').map(Number)
    
    let startMinutes = startTime[0] * 60 + startTime[1]
    let endMinutes = endTime[0] * 60 + endTime[1]
    
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60 // Next day
    }
    
    return ((endMinutes - startMinutes) / 60).toFixed(1)
  }

  // Calculate total periods that can fit in the day
  const calculateMaxPeriods = () => {
    const startTime = params.schoolStartTime.split(':').map(Number)
    const endTime = params.schoolEndTime.split(':').map(Number)
    
    let startMinutes = startTime[0] * 60 + startTime[1]
    let endMinutes = endTime[0] * 60 + endTime[1]
    
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60 // Next day
    }
    
    const totalMinutes = endMinutes - startMinutes
    
    // Account for lunch break
    let availableMinutes = totalMinutes
    if (params.includeLunchBreak) {
      availableMinutes -= params.lunchBreakDuration
    }
    
    // Each period includes the period itself plus a break
    const minutesPerPeriod = params.periodDuration + params.breakDuration
    
    // Calculate max periods and round down
    return Math.floor(availableMinutes / minutesPerPeriod)
  }

  const maxPeriods = calculateMaxPeriods()

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Timetable Generation Options</CardTitle>
            <CardDescription>Customize how your timetable is generated</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="time-settings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="time-settings" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Time Settings</span>
            </TabsTrigger>
            <TabsTrigger value="days-periods" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              <span>Days & Periods</span>
            </TabsTrigger>
            <TabsTrigger value="breaks" className="flex items-center gap-1">
              <Coffee className="h-4 w-4" />
              <span>Breaks</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Time Settings Tab */}
          <TabsContent value="time-settings" className="space-y-4 pt-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="schoolStartTime">School Start Time</Label>
                <Input
                  id="schoolStartTime"
                  type="time"
                  value={params.schoolStartTime}
                  onChange={(e) => handleChange('schoolStartTime', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolEndTime">School End Time</Label>
                <Input
                  id="schoolEndTime"
                  type="time"
                  value={params.schoolEndTime}
                  onChange={(e) => handleChange('schoolEndTime', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodDuration">
                  Period Duration: {params.periodDuration} minutes
                </Label>
                <Slider
                  id="periodDuration"
                  min={30}
                  max={90}
                  step={5}
                  value={[params.periodDuration]}
                  onValueChange={(value) => handleChange('periodDuration', value[0])}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="breakDuration">
                  Break Duration: {params.breakDuration} minutes
                </Label>
                <Slider
                  id="breakDuration"
                  min={5}
                  max={30}
                  step={5}
                  value={[params.breakDuration]}
                  onValueChange={(value) => handleChange('breakDuration', value[0])}
                />
              </div>
            </div>
            
            <div className="rounded-md bg-muted p-4 mt-4">
              <h4 className="font-medium mb-2">Time Summary</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span>School hours:</span>
                  <span className="font-medium">{calculateTotalHours()} hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Maximum periods possible:</span>
                  <span className="font-medium">{maxPeriods} periods</span>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Days & Periods Tab */}
          <TabsContent value="days-periods" className="space-y-4 pt-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="daysPerWeek">School Days Per Week</Label>
                <Select 
                  value={params.daysPerWeek.toString()} 
                  onValueChange={(value) => handleChange('daysPerWeek', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 days (Mon-Fri)</SelectItem>
                    <SelectItem value="6">6 days (Mon-Sat)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="periodsPerDay">
                  Default Periods Per Day: {params.periodsPerDay}
                </Label>
                <Slider
                  id="periodsPerDay"
                  min={4}
                  max={Math.min(12, maxPeriods)}
                  step={1}
                  value={[params.periodsPerDay]}
                  onValueChange={(value) => handleChange('periodsPerDay', value[0])}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="customPeriodsPerDay"
                checked={params.customPeriodsPerDay}
                onCheckedChange={(checked) => handleChange('customPeriodsPerDay', checked)}
              />
              <Label htmlFor="customPeriodsPerDay">Use custom periods for each day</Label>
            </div>
            
            {params.customPeriodsPerDay && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                {displayedDays.map((day, index) => (
                  <div key={day} className="space-y-2">
                    <Label htmlFor={`${day.toLowerCase()}Periods`}>
                      {day}: {params[`${day.toLowerCase()}Periods` as keyof TimetableGenerationParams] as number} periods
                    </Label>
                    <Slider
                      id={`${day.toLowerCase()}Periods`}
                      min={4}
                      max={Math.min(12, maxPeriods)}
                      step={1}
                      value={[params[`${day.toLowerCase()}Periods` as keyof TimetableGenerationParams] as number]}
                      onValueChange={(value) => 
                        handleChange(
                          `${day.toLowerCase()}Periods` as keyof TimetableGenerationParams, 
                          value[0]
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Breaks Tab */}
          <TabsContent value="breaks" className="space-y-4 pt-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="includeLunchBreak"
                checked={params.includeLunchBreak}
                onCheckedChange={(checked) => handleChange('includeLunchBreak', checked)}
              />
              <Label htmlFor="includeLunchBreak">Include lunch break</Label>
            </div>
            
            {params.includeLunchBreak && (
              <div className="grid gap-6 md:grid-cols-2 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="lunchBreakStartTime">Lunch Break Start Time</Label>
                  <Input
                    id="lunchBreakStartTime"
                    type="time"
                    value={params.lunchBreakStartTime}
                    onChange={(e) => handleChange('lunchBreakStartTime', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lunchBreakDuration">
                    Lunch Break Duration: {params.lunchBreakDuration} minutes
                  </Label>
                  <Slider
                    id="lunchBreakDuration"
                    min={15}
                    max={90}
                    step={15}
                    value={[params.lunchBreakDuration]}
                    onValueChange={(value) => handleChange('lunchBreakDuration', value[0])}
                  />
                </div>
              </div>
            )}
            
            <div className="rounded-md bg-muted p-4 mt-4">
              <h4 className="font-medium mb-2">Break Summary</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Short breaks between periods:</span>
                  <span className="font-medium">{params.breakDuration} minutes</span>
                </div>
                {params.includeLunchBreak && (
                  <div className="flex justify-between">
                    <span>Lunch break at {params.lunchBreakStartTime}:</span>
                    <span className="font-medium">{params.lunchBreakDuration} minutes</span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <Undo className="mr-2 h-4 w-4" />
            Reset to Default
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Options
        </Button>
      </CardFooter>
    </Card>
  )
}
