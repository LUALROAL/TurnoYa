using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Text.Json;
using TurnoYa.Application.DTOs.City;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace TurnoYaAPI.Controllers
{
    /// <summary>
    /// Controlador para gestión de ciudades y departamentos (autocomplete y búsqueda)
    /// </summary>
    [ApiController]
    [Route("api/cities")]
    public class CitiesController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public CitiesController(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        /// <summary>
        /// Busca departamentos que coincidan con el texto ingresado (autocomplete).
        /// </summary>
        [HttpGet("search-departments")]
        /// <summary>
        /// Busca departamentos que coincidan con el texto ingresado (autocomplete).
        /// </summary>
        /// <param name="query">Texto para filtrar departamentos</param>
        /// <returns>Lista de departamentos coincidentes</returns>
        public async Task<IActionResult> SearchDepartments([FromQuery] string query)
        {
            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "Data", "colombia_cities.json");
            if (!System.IO.File.Exists(filePath))
                return StatusCode(500, new { error = "Cities data file not found" });

            var json = await System.IO.File.ReadAllTextAsync(filePath);
            var data = JsonSerializer.Deserialize<ColombiaDepartmentsDto>(json);
            if (data == null || data.departments == null)
                return StatusCode(500, new { error = "Cities data file is invalid" });

            var matches = data.departments
                .Where(d => string.IsNullOrWhiteSpace(query) || d.name.Contains(query, StringComparison.OrdinalIgnoreCase))
                .Select(d => d.name)
                .OrderBy(d => d)
                .ToList();
            return Ok(matches);
        }

        /// <summary>
        /// Busca ciudades que coincidan con el texto ingresado, opcionalmente filtrando por departamento (autocomplete).
        /// </summary>
        [HttpGet("search-cities")]
        /// <summary>
        /// Busca ciudades que coincidan con el texto ingresado, opcionalmente filtrando por departamento (autocomplete).
        /// </summary>
        /// <param name="department">Departamento para filtrar</param>
        /// <param name="query">Texto para filtrar ciudades</param>
        /// <returns>Lista de ciudades coincidentes</returns>
        public async Task<IActionResult> SearchCities([FromQuery] string? department, [FromQuery] string query = "")
        {
            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "Data", "colombia_cities.json");
            if (!System.IO.File.Exists(filePath))
                return StatusCode(500, new { error = "Cities data file not found" });

            var json = await System.IO.File.ReadAllTextAsync(filePath);
            var data = JsonSerializer.Deserialize<ColombiaDepartmentsDto>(json);
            if (data == null || data.departments == null)
                return StatusCode(500, new { error = "Cities data file is invalid" });

            IEnumerable<string> cities;
            if (!string.IsNullOrWhiteSpace(department))
            {
                var dept = data.departments.FirstOrDefault(d => d.name.Equals(department, StringComparison.OrdinalIgnoreCase));
                cities = dept?.cities ?? new List<string>();
            }
            else
            {
                cities = data.departments.SelectMany(d => d.cities);
            }

            var matches = cities
                .Where(c => string.IsNullOrWhiteSpace(query) || c.Contains(query, StringComparison.OrdinalIgnoreCase))
                .OrderBy(c => c)
                .ToList();
            return Ok(matches);
        }

        [HttpGet("by-department")]
        /// <summary>
        /// Obtiene todas las ciudades de un departamento específico.
        /// </summary>
        /// <param name="department">Nombre del departamento</param>
        /// <returns>Lista de ciudades del departamento</returns>
        public async Task<IActionResult> GetCitiesByDepartment([FromQuery] string department)
        {
            if (string.IsNullOrWhiteSpace(department))
                return BadRequest(new { error = "Department is required" });

            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "Data", "colombia_cities.json");
            if (!System.IO.File.Exists(filePath))
                return StatusCode(500, new { error = "Cities data file not found" });

            var json = await System.IO.File.ReadAllTextAsync(filePath);
            var data = JsonSerializer.Deserialize<ColombiaDepartmentsDto>(json);
            if (data == null || data.departments == null)
                return StatusCode(500, new { error = "Cities data file is invalid" });

            var dept = data.departments.FirstOrDefault(d => d.name.Equals(department, StringComparison.OrdinalIgnoreCase));
            var cities = dept?.cities?.OrderBy(c => c).ToList() ?? new List<string>();
            return Ok(cities);
        }

        [HttpGet("autocomplete")]
        /// <summary>
        /// Autocompleta ciudades usando OpenStreetMap, filtrando por query y departamento.
        /// </summary>
        /// <param name="query">Texto para filtrar ciudades</param>
        /// <param name="department">Departamento para filtrar</param>
        /// <returns>Lista de ciudades sugeridas</returns>
        public async Task<IActionResult> Autocomplete([FromQuery] string? query, [FromQuery] string? department = null)
        {
            // Validación: se requiere al menos query o department
            if (string.IsNullOrWhiteSpace(query) && string.IsNullOrWhiteSpace(department))
            {
                var problem = new ProblemDetails
                {
                    Title = "One or more validation errors occurred.",
                    Status = 400,
                };
                problem.Extensions["errors"] = new Dictionary<string, string[]>
                {
                    { "query", new[] { "The query field is required unless department is specified." } }
                };
                return BadRequest(problem);
            }

            var client = _httpClientFactory.CreateClient();
            // Si no hay query pero sí departamento, usar '*' para traer todas las ciudades del departamento
            var searchQuery = string.IsNullOrWhiteSpace(query) ? "*" : query;
            var queryString = string.IsNullOrWhiteSpace(department)
                ? searchQuery + ", Colombia"
                : searchQuery + ", " + department + ", Colombia";
            var url = $"https://nominatim.openstreetmap.org/search?q={Uri.EscapeDataString(queryString)}&format=json&addressdetails=1&limit=15";
            client.DefaultRequestHeaders.UserAgent.ParseAdd("TurnoYaApp/1.0 (contacto@tunegocio.com)");

            var response = await client.GetAsync(url);
            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, "Error contacting Nominatim");

            var json = await response.Content.ReadAsStringAsync();
            var data = JsonSerializer.Deserialize<List<NominatimResultDto>>(json) ?? new List<NominatimResultDto>();

            var prioritized = data
                .OrderByDescending(item => item.@class == "place" && new[] { "city", "town", "village", "hamlet", "locality" }.Contains(item.type) ? 1 : 0)
                .ThenBy(item => item.display_name)
                .Select(item => new
                {
                    name = item.address?.city ?? item.address?.town ?? item.address?.village ?? item.address?.hamlet ?? item.address?.locality ?? item.display_name.Split(',')[0],
                    state = item.address?.state,
                    lat = item.lat,
                    lon = item.lon
                })
                .Where(x => string.IsNullOrWhiteSpace(department) || (x.state != null && x.state.ToLower().Contains(department.ToLower())))
                .GroupBy(x => x.name)
                .Select(g => g.First())
                .Take(10)
                .ToList();

            return Ok(prioritized);
        }

        public class ColombiaDepartmentsDto
        {
            public List<ColombiaDepartmentDto> departments { get; set; } = new();
        }
        public class ColombiaDepartmentDto
        {
            public string name { get; set; } = string.Empty;
            public List<string> cities { get; set; } = new();
        }
    }
}
