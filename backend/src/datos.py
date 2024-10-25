from enum import auto, Enum

datos = { #MIN MAX
    '0': (0, 0), 
    '1': (0, 0),  # Temperature
    '2': (0, 0),  # Temperature #2
    '3': (0, 0),  # Relative Humidity
    '4': (0, 0),  # Atmospheric Pressure
    '5': (0, 0),  # Light (lux)
    '6': (0, 0),  # Soil Moisture
    '7': (0, 0),  # Soil Moisture #2
    '8': (0, 0),  # Soil Resistance
    '9': (0, 0),  # Soil Resistance #2
    '10': (0, 0),  # Oxygen
    '11': (0, 0),  # Carbon Dioxide
    '12': (0, 0),  # Wind Speed
    '13': (0, 0),  # Rainfall
    '14': (0, 0),  # Wind Direction
    '15': (0, 0),  # Motion
    '16': (0, 0),  # Voltage
    '17': (0, 0),  # Voltage #2
    '18': (0, 0),  # Current
    '19': (0, 0),  # Current #2
    '20' : (0, 0),  # Iterations
    '21': (0, 0),  # GPS Latitude
    '22': (0, 0),  # GPS Longitude
    '23': (0, 0),  # GPS Altitude
    '24': (0, 0)  # GPS HDOP
#    'STATUS': (0, 0, 0), 
#    'TEMP_T': (0, 0, 0),  # Temperature
#    'TEMP2_T': (0, 0, 0),  # Temperature #2
#    'HUMIDITY_T': (0, 0, 0),  # Relative Humidity
#    'PRESSURE_T': (0, 0, 0),  # Atmospheric Pressure
#    'LIGHT_T': (0, 0, 0),  # Light (lux)
#    'SOIL_T': (0, 0, 0),  # Soil Moisture
#    'SOIL2_T': (0, 0, 0),  # Soil Moisture #2
#    'SOILR_T': (0, 0, 0),  # Soil Resistance
#    'SOILR2_T': (0, 0, 0),  # Soil Resistance #2
#    'OXYGEN_T': (0, 0, 0),  # Oxygen
#    'CO2_T': (0, 0, 0),  # Carbon Dioxide
#    'WINDSPD_T': (0, 0, 0),  # Wind Speed
#    'RAINFALL_T': (0, 0, 0),  # Rainfall
#    'WINDHDG_T': (0, 0, 0),  # Wind Direction
#    'MOTION_T': (0, 0, 0),  # Motion
#    'VOLTAGE_T': (0, 0, 0),  # Voltage
#    'VOLTAGE2_T': (0, 0, 0),  # Voltage #2
#    'CURRENT_T': (0, 0, 0),  # Current
#    'CURRENT2_T': (0, 0, 0),  # Current #2
#    'IT_T' : (0, 0, 0),  # Iterations
#    'LATITUDE_T': (0, 0, 0),  # GPS Latitude
#    'LONGITUDE_T': (0, 0, 0),  # GPS Longitude
#    'ALTITUDE_T': (0, 0, 0),  # GPS Altitude
#    'HDOP_T': (0, 0, 0)  # GPS HDOP
}