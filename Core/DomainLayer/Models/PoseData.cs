namespace DomainLayer.Models;

public class PoseData
{
    public List<Keypoint> Keypoints { get; set; } = new();
    public double? Timestamp { get; set; }
    public int? FrameNumber { get; set; }
    public string? Metadata { get; set; }
}

public class Keypoint
{
    public string Name { get; set; } = string.Empty;
    public double X { get; set; }
    public double Y { get; set; }
    public double? Z { get; set; }
    public double Confidence { get; set; }
    public bool IsVisible { get; set; }
}
