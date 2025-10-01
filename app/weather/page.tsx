"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
// import { useToast } from "@/hooks/use-toast"
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  CloudSnow, 
  Wind, 
  Droplets, 
  Eye, 
  Thermometer,
  Gauge,
  Sun as SunIcon,
  Moon,
  Sunrise,
  Sunset
} from "lucide-react"

interface WeatherData {
  location: string
  temperature: number
  temperature_unit: string
  condition: string
  humidity: number
  wind_speed: number
  wind_unit: string
  wind_direction: number
  pressure: number
  pressure_unit: string
  visibility: number
  visibility_unit: string
  uv_index: number
  feels_like: number
  description: string
  timestamp: string
}

interface WeatherResponse {
  weather_data: WeatherData
  summary: string
  recommendations: string[]
  additional_info: string
}

export default function WeatherApp() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  // const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setWeatherData(null)

    try {
      const response = await fetch('/api/weather', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch weather data')
      }

      if (data.success && data.data) {
        setWeatherData(data.data)
        // toast({
        //   title: "Weather data loaded!",
        //   description: `Successfully fetched weather for ${data.data.weather_data.location}`,
        // })
      } else {
        throw new Error(data.message || 'No weather data received')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      // toast({
      //   variant: "destructive",
      //   title: "Error",
      //   description: errorMessage,
      // })
    } finally {
      setLoading(false)
    }
  }

  const getWeatherIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase()
    if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
      return <CloudRain className="h-8 w-8 text-blue-500" />
    } else if (lowerCondition.includes('snow')) {
      return <CloudSnow className="h-8 w-8 text-blue-300" />
    } else if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
      return <Cloud className="h-8 w-8 text-gray-500" />
    } else if (lowerCondition.includes('clear') || lowerCondition.includes('sunny')) {
      return <Sun className="h-8 w-8 text-yellow-500" />
    } else {
      return <Cloud className="h-8 w-8 text-gray-400" />
    }
  }

  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    const index = Math.round(degrees / 22.5) % 16
    return directions[index]
  }

  const exampleQueries = [
    "What's the weather in Paris?",
    "How's the weather in New York City?",
    "Tell me about the weather in Tokyo",
    "Weather forecast for London",
    "Is it raining in San Francisco?",
    "Current weather in Sydney, Australia"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Weather Assistant
          </h1>
          <p className="text-lg text-muted-foreground">
            Ask about weather anywhere in the world using natural language
          </p>
          <Badge variant="outline" className="text-sm">
            Powered by OpenAI Responses API + Open-Meteo
          </Badge>
        </div>

        {/* Query Form */}
        <Card>
          <CardHeader>
            <CardTitle>Ask About Weather</CardTitle>
            <CardDescription>
              Use natural language to ask about weather conditions anywhere in the world
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="query">Weather Query</Label>
                <Textarea
                  id="query"
                  placeholder="e.g., What's the weather like in Paris? or How's the weather in New York City?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <Button type="submit" disabled={loading || !query.trim()} className="w-full">
                {loading ? "Getting Weather..." : "Get Weather"}
              </Button>
            </form>

            {/* Example Queries */}
            <div className="mt-6">
              <Label className="text-sm font-medium">Try these examples:</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {exampleQueries.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery(example)}
                    className="text-xs"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-8 w-[80px]" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Weather Results */}
        {weatherData && (
          <div className="space-y-6">
            {/* Main Weather Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{weatherData.weather_data.location}</CardTitle>
                    <CardDescription>{weatherData.summary}</CardDescription>
                  </div>
                  {getWeatherIcon(weatherData.weather_data.condition)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Temperature */}
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600">
                      {weatherData.weather_data.temperature}°
                      {weatherData.weather_data.temperature_unit === 'celsius' ? 'C' : 'F'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Feels like {weatherData.weather_data.feels_like}°
                      {weatherData.weather_data.temperature_unit === 'celsius' ? 'C' : 'F'}
                    </div>
                    <Badge variant="secondary" className="mt-2">
                      {weatherData.weather_data.condition}
                    </Badge>
                  </div>

                  {/* Weather Details */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Droplets className="h-5 w-5 text-blue-500" />
                      <span className="text-sm">Humidity: {weatherData.weather_data.humidity}%</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Wind className="h-5 w-5 text-gray-500" />
                      <span className="text-sm">
                        Wind: {weatherData.weather_data.wind_speed} {weatherData.weather_data.wind_unit} 
                        {getWindDirection(weatherData.weather_data.wind_direction)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Gauge className="h-5 w-5 text-purple-500" />
                      <span className="text-sm">
                        Pressure: {weatherData.weather_data.pressure} {weatherData.weather_data.pressure_unit}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Eye className="h-5 w-5 text-green-500" />
                      <span className="text-sm">
                        Visibility: {weatherData.weather_data.visibility} {weatherData.weather_data.visibility_unit}
                      </span>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="space-y-3">
                    <div className="text-sm">
                      <strong>Description:</strong>
                      <p className="text-muted-foreground mt-1">{weatherData.weather_data.description}</p>
                    </div>
                    <div className="text-sm">
                      <strong>Last Updated:</strong>
                      <p className="text-muted-foreground mt-1">
                        {new Date(weatherData.weather_data.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            {weatherData.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {weatherData.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Information */}
            {weatherData.additional_info && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{weatherData.additional_info}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>
              This weather app demonstrates the power of OpenAI's Responses API with tool calling and structured outputs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h3 className="font-semibold">Natural Language</h3>
                <p className="text-sm text-muted-foreground">
                  Ask about weather using natural language - no need to specify exact coordinates or formats
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-purple-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold">Tool Calling</h3>
                <p className="text-sm text-muted-foreground">
                  AI automatically calls Open-Meteo API to fetch real-time weather data based on your query
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold">Structured Output</h3>
                <p className="text-sm text-muted-foreground">
                  Weather data is formatted consistently with recommendations and additional insights
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
