namespace TurnoYa.Application.DTOs.City
{
    public class NominatimResultDto
    {
        public required string display_name { get; set; } = string.Empty;
        public required string @class { get; set; } = string.Empty;
        public required string type { get; set; } = string.Empty;
        public required string lat { get; set; } = string.Empty;
        public required string lon { get; set; } = string.Empty;
        public required AddressDto address { get; set; } = new AddressDto();
    }

    public class AddressDto
    {
        public string city { get; set; }
        public string town { get; set; }
        public string village { get; set; }
        public string hamlet { get; set; }
        public string locality { get; set; }
        public string state { get; set; }

        public AddressDto()
        {
            city = string.Empty;
            town = string.Empty;
            village = string.Empty;
            hamlet = string.Empty;
            locality = string.Empty;
            state = string.Empty;
        }
    }
}
