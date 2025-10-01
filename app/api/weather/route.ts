import OpenAI from "openai";
import { z } from "zod";

// Initialize OpenAI client lazily
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Weather data schema for structured outputs
const WeatherDataSchema = z.object({
  location: z.string().describe("The location name"),
  temperature: z.number().describe("Current temperature"),
  temperature_unit: z.enum(["celsius", "fahrenheit"]).describe("Temperature unit"),
  condition: z.string().describe("Weather condition (e.g., 'sunny', 'rainy', 'cloudy')"),
  humidity: z.number().describe("Humidity percentage"),
  wind_speed: z.number().describe("Wind speed"),
  wind_unit: z.enum(["kmh", "mph"]).describe("Wind speed unit"),
  wind_direction: z.number().describe("Wind direction in degrees"),
  pressure: z.number().describe("Atmospheric pressure"),
  pressure_unit: z.enum(["hPa", "mb"]).describe("Pressure unit"),
  visibility: z.number().describe("Visibility distance"),
  visibility_unit: z.enum(["km", "miles"]).describe("Visibility unit"),
  uv_index: z.number().describe("UV index"),
  feels_like: z.number().describe("Feels like temperature"),
  description: z.string().describe("Human-readable weather description"),
  timestamp: z.string().describe("ISO timestamp of the weather data"),
});

// Tool definition for fetching weather data
const weatherTool = {
  type: "function" as const,
  name: "get_weather_data",
  description: "Fetch current weather data for a specific location using Open-Meteo API",
  strict: true,
  parameters: {
    type: "object",
    properties: {
      latitude: {
        type: "number",
        description: "Latitude coordinate of the location"
      },
      longitude: {
        type: "number", 
        description: "Longitude coordinate of the location"
      },
      location_name: {
        type: "string",
        description: "Human-readable name of the location"
      },
      temperature_unit: {
        type: "string",
        enum: ["celsius", "fahrenheit"],
        description: "Temperature unit preference"
      },
      wind_unit: {
        type: "string", 
        enum: ["kmh", "mph"],
        description: "Wind speed unit preference"
      },
      pressure_unit: {
        type: "string",
        enum: ["hPa", "mb"], 
        description: "Pressure unit preference"
      },
      visibility_unit: {
        type: "string",
        enum: ["km", "miles"],
        description: "Visibility unit preference"
      }
    },
    required: ["latitude", "longitude", "location_name"],
    additionalProperties: false
  }
};

// Function to fetch weather data from Open-Meteo API
async function fetchWeatherData(params: any) {
  try {
    const { latitude, longitude, temperature_unit = "celsius", wind_unit = "kmh", pressure_unit = "hPa", visibility_unit = "km" } = params;
    
    // Open-Meteo API endpoint
    const url = `https://api.open-meteo.com/v1/current?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,visibility&temperature_unit=${temperature_unit}&wind_speed_unit=${wind_unit}&precipitation_unit=mm`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${data.reason || 'Unknown error'}`);
    }
    
    const current = data.current;
    
    // Convert weather code to condition
    const weatherConditions: { [key: number]: string } = {
      0: "clear sky",
      1: "mainly clear", 
      2: "partly cloudy",
      3: "overcast",
      45: "fog",
      48: "depositing rime fog",
      51: "light drizzle",
      53: "moderate drizzle", 
      55: "dense drizzle",
      56: "light freezing drizzle",
      57: "dense freezing drizzle",
      61: "slight rain",
      63: "moderate rain",
      65: "heavy rain",
      66: "light freezing rain",
      67: "heavy freezing rain",
      71: "slight snow fall",
      73: "moderate snow fall",
      75: "heavy snow fall",
      77: "snow grains",
      80: "slight rain showers",
      81: "moderate rain showers", 
      82: "violent rain showers",
      85: "slight snow showers",
      86: "heavy snow showers",
      95: "thunderstorm",
      96: "thunderstorm with slight hail",
      99: "thunderstorm with heavy hail"
    };
    
    const condition = weatherConditions[current.weather_code] || "unknown";
    
    // Convert pressure unit if needed
    let pressure = current.pressure_msl;
    let pressureUnit = pressure_unit;
    if (pressure_unit === "mb") {
      pressure = pressure * 0.01; // Convert hPa to mb
    }
    
    // Convert visibility unit if needed  
    let visibility = current.visibility;
    let visibilityUnit = visibility_unit;
    if (visibility_unit === "miles") {
      visibility = visibility * 0.621371; // Convert km to miles
    }
    
    return {
      location: params.location_name,
      temperature: current.temperature_2m,
      temperature_unit: temperature_unit,
      condition: condition,
      humidity: current.relative_humidity_2m,
      wind_speed: current.wind_speed_10m,
      wind_unit: wind_unit,
      wind_direction: current.wind_direction_10m,
      pressure: pressure,
      pressure_unit: pressureUnit,
      visibility: visibility,
      visibility_unit: visibilityUnit,
      uv_index: 0, // Open-Meteo doesn't provide UV index in current weather
      feels_like: current.apparent_temperature,
      description: `Current weather in ${params.location_name}: ${condition} with temperature of ${current.temperature_2m}°${temperature_unit === 'celsius' ? 'C' : 'F'}`,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Weather API error:', error);
    throw new Error(`Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return Response.json({ error: "Query is required" }, { status: 400 });
    }

    // Use Responses API with tool calling
    const openai = getOpenAIClient();
    const response = await openai.responses.create({
      model: "gpt-4o-2024-08-06",
      input: [
        {
          role: "system",
          content: `You are a helpful weather assistant. When users ask about weather, you should:

1. Extract location information from their query
2. Use the get_weather_data tool to fetch current weather data
3. Provide a helpful response with the weather information

Common ways users might ask for weather:
- "What's the weather in Paris?"
- "How's the weather in New York City?"
- "Tell me about the weather in London"
- "Weather forecast for Tokyo"
- "Is it raining in San Francisco?"

Always use the tool to get real weather data. If you can't determine a location, ask the user to specify.`
        },
        {
          role: "user", 
          content: query
        }
      ],
      tools: [weatherTool],
      tool_choice: "auto"
    });

    // Check if the model made a tool call
    if (response.output && response.output.length > 0) {
      const output = response.output[0];
      
      if (output.type === "message" && output.content) {
        for (const content of output.content) {
          if ('tool_call' in content && content.tool_call) {
            // Execute the weather tool
            const toolCall = content.tool_call as any;
            
            if (toolCall.function?.name === "get_weather_data") {
              const args = JSON.parse(toolCall.function.arguments);
              
              try {
                const weatherData = await fetchWeatherData(args);
                
                // Use structured outputs to format the response
                const structuredResponse = await openai.responses.parse({
                  model: "gpt-4o-2024-08-06",
                  input: [
                    {
                      role: "system",
                      content: "Format the weather data into a structured response with helpful information for the user."
                    },
                    {
                      role: "user",
                      content: `Here's the weather data: ${JSON.stringify(weatherData)}. Please provide a helpful response to the user's query: "${query}"`
                    }
                  ],
                  text: {
                    format: {
                      type: "json_schema",
                      name: "weather_response",
                      schema: {
                        type: "object",
                        properties: {
                          weather_data: WeatherDataSchema.shape,
                          summary: {
                            type: "string",
                            description: "Brief weather summary"
                          },
                          recommendations: {
                            type: "array",
                            items: { type: "string" },
                            description: "Weather-based recommendations (e.g., clothing, activities)"
                          },
                          additional_info: {
                            type: "string", 
                            description: "Any additional helpful information"
                          }
                        },
                        required: ["weather_data", "summary", "recommendations", "additional_info"],
                        additionalProperties: false
                      },
                      strict: true
                    }
                  }
                });
                
                return Response.json({
                  success: true,
                  data: structuredResponse.output_parsed,
                  raw_weather: weatherData
                });
                
              } catch (error) {
                return Response.json({
                  error: "Failed to fetch weather data",
                  details: error instanceof Error ? error.message : "Unknown error"
                }, { status: 500 });
              }
            }
          }
        }
      }
    }
    
    // If no tool call was made, return the text response
    return Response.json({
      success: true,
      message: response.output_text || "I'd be happy to help with weather information. Please specify a location, for example: 'What's the weather in Paris?'"
    });
    
  } catch (error) {
    console.error('Weather API error:', error);
    return Response.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
