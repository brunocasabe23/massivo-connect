"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom" // Añadido
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, User, Mail, Lock, Eye, EyeOff, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import { callApi } from "@/services/api" // Añadido - Asegúrate que la ruta es correcta

export default function RegisterForm() {
  const { toast } = useToast()
  const navigate = useNavigate() // Añadido
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [validation, setValidation] = useState({
    name: null as null | boolean,
    email: null as null | boolean,
    password: null as null | boolean,
    confirmPassword: null as null | boolean,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Validate on change
    if (name === "name") {
      setValidation((prev) => ({ ...prev, name: value.length >= 2 ? true : value ? false : null }))
    } else if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      setValidation((prev) => ({ ...prev, email: value ? emailRegex.test(value) : null }))
    } else if (name === "password") {
      const passwordValid = value.length >= 6
      setValidation((prev) => ({
        ...prev,
        password: value ? passwordValid : null,
        confirmPassword: formData.confirmPassword ? formData.confirmPassword === value : null,
      }))
    } else if (name === "confirmPassword") {
      setValidation((prev) => ({
        ...prev,
        confirmPassword: value ? value === formData.password : null,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Reset success state if resubmitting
    if (isSuccess) {
      setIsSuccess(false)
    }

    // Validate all fields before submission
    const nameValid = formData.name.length >= 2
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    const passwordValid = formData.password.length >= 6
    const confirmPasswordValid = formData.password === formData.confirmPassword

    setValidation({
      name: nameValid,
      email: emailValid,
      password: passwordValid,
      confirmPassword: confirmPasswordValid,
    })

    if (!nameValid || !emailValid || !passwordValid || !confirmPasswordValid) {
      toast({
        title: "Error de validación",
        description: "Por favor, verifica los campos marcados en rojo.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const data = { nombre: formData.name, email: formData.email, password: formData.password }
      // Asegúrate que la ruta '/auth/register' y el método 'POST' son correctos para tu API
      await callApi('/auth/register', { method: 'POST', data })

      setIsSuccess(true)
      toast({
        title: "Registro exitoso",
        description: "Tu cuenta ha sido creada. Ahora puedes iniciar sesión.",
      })

      // Redirigir a login después de un breve retraso
      setTimeout(() => {
        navigate('/login')
      }, 1500)

    } catch (err) {
      setIsSuccess(false) // Resetea el estado de éxito en caso de error
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error inesperado durante el registro.'
      toast({
        title: "Error de Registro",
        description: errorMessage,
        variant: "destructive",
      })
      // No es necesario desactivar isLoading aquí si hay un finally
    } finally {
      // Asegurarse de que isLoading se desactive siempre
      setIsLoading(false)
    }
  }

  const getInputClasses = (field: keyof typeof validation) => {
    const baseClasses = "pl-10 transition-all duration-300"
    if (validation[field] === null) return baseClasses
    return validation[field]
      ? `${baseClasses} border-green-500 focus:border-green-500 focus:ring-green-500/20`
      : `${baseClasses} border-red-500 focus:border-red-500 focus:ring-red-500/20`
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Nombre completo</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            id="name"
            name="name"
            placeholder="Tu nombre"
            value={formData.name}
            onChange={handleChange}
            className={getInputClasses("name")}
            disabled={isLoading}
          />
          {validation.name === false && (
            <p className="mt-1 text-xs text-red-500">El nombre debe tener al menos 2 caracteres</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email">Correo electrónico</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            id="register-email"
            name="email"
            type="email"
            placeholder="tu@correo.com"
            value={formData.email}
            onChange={handleChange}
            className={getInputClasses("email")}
            disabled={isLoading}
          />
          {validation.email === false && <p className="mt-1 text-xs text-red-500">Correo electrónico inválido</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">Contraseña</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            id="register-password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            className={getInputClasses("password")}
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          {validation.password === false && (
            <p className="mt-1 text-xs text-red-500">La contraseña debe tener al menos 6 caracteres</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirmar contraseña</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            id="confirm-password"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={getInputClasses("confirmPassword")}
            disabled={isLoading}
          />
          {validation.confirmPassword === false && (
            <p className="mt-1 text-xs text-red-500">Las contraseñas no coinciden</p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        className={`w-full btn-animated transition-all duration-300 ${
          isSuccess ? "bg-green-500 hover:bg-green-600" : "bg-[#005291] hover:bg-[#004277]"
        }`}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creando cuenta...
          </>
        ) : isSuccess ? (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              <CheckCircle className="mr-2 h-5 w-5" />
            </motion.div>
            Cuenta creada
          </>
        ) : (
          "Crear Cuenta"
        )}
      </Button>
    </motion.form>
  )
}
