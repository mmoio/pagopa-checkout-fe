/* eslint-disable functional/immutable-data */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Box, Skeleton, SxProps, Typography } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";

function FieldContainer(props: {
  title: string;
  body: string | number | undefined;
  footer?: React.ReactNode;
  icon?: React.ReactNode;
  flexDirection?: "row" | "column";
  titleVariant?: "body2" | "sidenav";
  bodyVariant?: "body2" | "sidenav";
  sx?: SxProps;
  endAdornment?: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  tabIndex?: number;
  role?: string;
  overflowWrapBody?: boolean;
}) {
  const { t } = useTranslation();
  const defaultStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid",
    borderBottomColor: "divider",
    py: 2,
  };

  return (
    <Box
      sx={{ ...defaultStyle, ...props.sx }}
      onClick={props.onClick}
      onKeyDown={props.onKeyDown}
      tabIndex={props.tabIndex}
      role={props.role}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "start",
          gap: 3,
          width: "100%",
        }}
      >
        {props.icon && props.loading ? (
          <Skeleton variant="circular" width="40px" height="40px" />
        ) : (
          props.icon
        )}
        <Box
          sx={{
            display: "flex",
            alignItems: props.flexDirection === "row" ? "center" : "",
            justifyContent: "space-between",
            flexDirection: props.flexDirection,
            width: "100%",
          }}
        >
          <Typography variant={props.titleVariant} component={"div"} pr={2}>
            {props.loading ? (
              <Skeleton variant="text" width="125px" height="30px" />
            ) : (
              t(props.title)
            )}
          </Typography>
          <Typography
            variant={props.bodyVariant}
            component={"div"}
            sx={{
              overflowWrap: props.overflowWrapBody ? "anywhere" : "normal",
            }}
          >
            {props.loading ? (
              <Skeleton variant="text" width="188px" height="24px" />
            ) : (
              props.body
            )}
          </Typography>
          {props.footer && (
            <Typography variant={props.bodyVariant} component={"div"}>
              {props.loading ? (
                <Skeleton variant="text" width="188px" height="24px" />
              ) : (
                props.footer
              )}
            </Typography>
          )}
        </Box>
      </Box>
      {props.endAdornment}
    </Box>
  );
}

FieldContainer.defaultProps = {
  flexDirection: "column",
  titleVariant: "body2",
  bodyVariant: "sidenav",
  overflowWrapBody: true,
};

export default FieldContainer;
