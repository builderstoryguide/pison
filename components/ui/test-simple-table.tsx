'use client'

import React from 'react'
import { SimpleTable } from './simple-table'

// Test data with mixed types including objects
const testData = [
  {
    id: 1,
    name: 'John Doe',
    subject: { id: 'math', name: 'Mathematics' },
    status: 'active',
    score: 85
  },
  {
    id: 2,
    name: 'Jane Smith',
    subject: { id: 'science', name: 'Science' },
    status: 'inactive',
    score: 92
  },
  {
    id: 3,
    name: 'Bob Johnson',
    subject: { id: 'math', name: 'Mathematics' },
    status: 'active',
    score: 78
  }
]

const testColumns = [
  {
    key: 'name' as const,
    label: 'Name',
    sortable: true,
    filterable: true
  },
  {
    key: 'subject' as const,
    label: 'Subject',
    sortable: true,
    filterable: true,
    render: (value: any) => value.name || 'Unknown'
  },
  {
    key: 'status' as const,
    label: 'Status',
    sortable: true,
    filterable: true
  },
  {
    key: 'score' as const,
    label: 'Score',
    sortable: true,
    filterable: false
  }
]

export default function TestSimpleTable() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Simple Table Test</h1>
      <p className="text-muted-foreground mb-6">
        This component tests the SimpleTable with mixed data types including objects.
      </p>
      
      <SimpleTable
        data={testData}
        columns={testColumns}
        searchable={true}
        filterable={true}
        sortable={true}
        onRowClick={(item) => {
          // Row click handler
        }}
        emptyMessage="No test data available"
      />
    </div>
  )
}
