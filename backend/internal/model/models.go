package model

import "time"

type User struct {
	ID          string    `json:"id"`
	Email       string    `json:"email"`
	DisplayName string    `json:"display_name"`
	CreatedAt   time.Time `json:"created_at"`
}

type UserSettings struct {
	UserID              string    `json:"user_id"`
	WeeklyTargetHours   float64   `json:"weekly_target_hours"`
	ReferenceSheetURL   string    `json:"reference_sheet_url"`
	GoalType            *string   `json:"goal_type"`
	GoalCustomText      *string   `json:"goal_custom_text"`
	ShowReferenceSheet  bool      `json:"show_reference_sheet"`
	UpdatedAt           time.Time `json:"updated_at"`
}

type UpdateSettingsRequest struct {
	WeeklyTargetHours   *float64 `json:"weekly_target_hours"`
	ReferenceSheetURL   *string  `json:"reference_sheet_url"`
	GoalType            *string  `json:"goal_type"`
	GoalCustomText      *string  `json:"goal_custom_text"`
	ShowReferenceSheet  *bool    `json:"show_reference_sheet"`
}

type SignupRequest struct {
	DisplayName string `json:"display_name"`
	Email       string `json:"email"`
	Password    string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type Category struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"`
	Name       string    `json:"name"`
	Color      string    `json:"color"`
	Position   int       `json:"position"`
	TopicCount int       `json:"topic_count,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

type Topic struct {
	ID            string    `json:"id"`
	UserID        string    `json:"user_id"`
	CategoryID    string    `json:"category_id"`
	CategoryName  string    `json:"category_name,omitempty"`
	ParentID      *string   `json:"parent_id"`
	Title         string    `json:"title"`
	Status        string    `json:"status"`
	Confidence    int       `json:"confidence"`
	NotesMd       *string   `json:"notes_md"`
	Position      int       `json:"position"`
	ResourceCount int       `json:"resource_count"`
	Subtopics     []Topic   `json:"subtopics,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type Resource struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"`
	TopicID    string    `json:"topic_id"`
	Type       string    `json:"type"`
	Title      string    `json:"title"`
	URL        string    `json:"url"`
	EstMinutes int       `json:"est_minutes"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
}

type StudyLog struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	TopicID   string    `json:"topic_id"`
	LoggedOn  string    `json:"logged_on"`
	Minutes   int       `json:"minutes"`
	Comment   *string   `json:"comment"`
	CreatedAt time.Time `json:"created_at"`
}

type Revision struct {
	ID           string  `json:"id"`
	UserID       string  `json:"user_id"`
	TopicID      string  `json:"topic_id"`
	TopicTitle   string  `json:"topic_title,omitempty"`
	CategoryName string  `json:"category_name,omitempty"`
	DueOn        string  `json:"due_on"`
	DoneOn       *string `json:"done_on"`
	Confidence   *int    `json:"confidence"`
}

type CompleteRevisionRequest struct {
	Confidence int `json:"confidence"`
}

type DashboardResponse struct {
	StreakDays        int                    `json:"streak_days"`
	WeeklyHours       float64                `json:"weekly_hours"`
	WeeklyTargetHours float64                `json:"weekly_target_hours"`
	RevisionsDueCount int                    `json:"revisions_due_count"`
	FocusTopic        *Topic                 `json:"focus_topic"`
	CategoryProgress  []CategoryProgressItem `json:"category_progress"`
	Heatmap           []HeatmapItem          `json:"heatmap"`
}

type CategoryProgressItem struct {
	CategoryID   string `json:"category_id"`
	CategoryName string `json:"category_name"`
	Color        string `json:"color"`
	TotalTopics  int    `json:"total_topics"`
	Learned      int    `json:"learned"`
	InProgress   int    `json:"in_progress"`
	NotStarted   int    `json:"not_started"`
}

type HeatmapItem struct {
	Date    string `json:"date"`
	Minutes int    `json:"minutes"`
}

type StatsResponse struct {
	TotalLoggedMinutes int               `json:"total_logged_minutes"`
	TotalSessions      int               `json:"total_sessions"`
	WeeklyHoursChart   []WeeklyChartItem `json:"weekly_hours_chart"`
	TopTopics          []TopTopicItem    `json:"top_topics"`
	Heatmap            []HeatmapItem     `json:"heatmap"`
}

type WeeklyChartItem struct {
	WeekStart string  `json:"week_start"`
	Hours     float64 `json:"hours"`
}

type TopTopicItem struct {
	TopicID      string `json:"topic_id"`
	TopicTitle   string `json:"topic_title"`
	CategoryName string `json:"category_name"`
	TotalMinutes int    `json:"total_minutes"`
}

type StandardResponse struct {
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

type ErrorResponse struct {
	Error ErrorDetail `json:"error"`
}

type ErrorDetail struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}
