import { Card, CardContent, Typography, Box } from "@mui/material";

function StatCard({ title, value, icon }) {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid #e5e7eb",
        borderRadius: 3,
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              {title}
            </Typography>

            <Typography variant="h4" fontWeight={700}>
              {value}
            </Typography>
          </Box>

          {icon}
        </Box>
      </CardContent>
    </Card>
  );
}

export default StatCard;