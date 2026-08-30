"use client"

import { User, Tractor, Plane, AlertTriangle } from "lucide-react"

interface RoleSelectorProps {
  value: string
  onChange: (role: string) => void
}

export default function RoleSelector({ value, onChange }: RoleSelectorProps) {
  const roles = [
    {
      id: 'citizen',
      label: 'Citizen',
      icon: User,
      description: 'General weather information'
    },
    {
      id: 'farmer',
      label: 'Farmer',
      icon: Tractor,
      description: 'Agricultural advisory'
    },
    {
      id: 'pilot',
      label: 'Pilot',
      icon: Plane,
      description: 'Aviation briefing'
    },
    {
      id: 'disaster-manager',
      label: 'Emergency',
      icon: AlertTriangle,
      description: 'Disaster response'
    }
  ]

  return (
    <div className="glass rounded-2xl p-4 border border-gray-200/50 dark:border-white/10">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
        I am a:
      </label>
      <div className="grid grid-cols-2 gap-2">
        {roles.map(role => {
          const Icon = role.icon
          const isActive = value === role.id

          return (
            <button
              key={role.id}
              onClick={() => onChange(role.id)}
              className={`p-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-blue-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title={role.description}
            >
              <Icon className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs font-medium">{role.label}</span>
            </button>
          )
        })}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
        Get responses tailored to your needs
      </p>
    </div>
  )
}
