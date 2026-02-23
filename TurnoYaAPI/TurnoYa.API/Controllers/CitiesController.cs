using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Text.Json;
using TurnoYa.Application.DTOs.City;

namespace TurnoYaAPI.Controllers
{
    [ApiController]
    [Route("api/cities")]
    public class CitiesController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public CitiesController(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        [HttpGet("autocomplete")]
        public async Task<IActionResult> Autocomplete([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return BadRequest("Query is required.");

            var client = _httpClientFactory.CreateClient();
            var url = $"https://nominatim.openstreetmap.org/search?q={Uri.EscapeDataString(query + ", Colombia")}&format=json&addressdetails=1&limit=15";
            client.DefaultRequestHeaders.UserAgent.ParseAdd("TurnoYaApp/1.0 (contacto@tunegocio.com)");

            var response = await client.GetAsync(url);
            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, "Error contacting Nominatim");

            var json = await response.Content.ReadAsStringAsync();
            var data = JsonSerializer.Deserialize<List<NominatimResultDto>>(json) ?? new List<NominatimResultDto>();

            // Priorizar ciudades, pero mostrar cualquier resultado relevante (city, town, village, hamlet, locality)
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
                .GroupBy(x => x.name) // Evitar duplicados por nombre
                .Select(g => g.First())
                .Take(10) // Solo mostrar los 10 primeros
                .ToList();

            return Ok(prioritized);
        }
    }
}
