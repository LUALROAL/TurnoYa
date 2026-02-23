namespace TurnoYa.Application.DTOs.City
{
    public class NominatimResultDto
    {
        public string display_name { get; set; }
        public string @class { get; set; }
        public string type { get; set; }
        public string lat { get; set; }
        public string lon { get; set; }
        public AddressDto address { get; set; }
    }

    public class AddressDto
    {
        public string city { get; set; }
        public string town { get; set; }
        public string village { get; set; }
        public string hamlet { get; set; }
        public string locality { get; set; }
        public string state { get; set; }
    }
}
