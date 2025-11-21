namespace DomainLayer.Models;

public class GymOccupancy
{
    public int OccupancyID { get; set; }
    public DateTime Timestamp { get; set; }
    public int PeopleCount { get; set; }
    public string ZoneName { get; set; } = string.Empty;
    public float OccupancyPercentage { get; set; }
    public string CameraID { get; set; } = string.Empty;
}
