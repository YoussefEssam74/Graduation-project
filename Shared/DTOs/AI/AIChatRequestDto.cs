using System.ComponentModel.DataAnnotations;

namespace Shared.DTOs.AI
{
    public class AIChatRequestDto
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        public string Query { get; set; } = null!;

        /// <summary>
        /// Optional session ID. If omitted, continues the latest open session or creates a new one.
        /// </summary>
        public int? SessionId { get; set; }

        public List<string>? ContentTypes { get; set; }
    }
}
