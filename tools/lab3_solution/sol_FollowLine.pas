procedure FollowLine(xi,yi,xf, yf, tf: double; var RC: TRobotControls);
var
  rotateToFinal, ang_target, error_dist, distLine, error_finalrot, V, Vn, W, nearX, nearY: double;
  alfa, VlinX, VlinY: double;
begin
  //Calc errors
  error_dist := Sqrt(power(xf-xOdo,2) + power(yf-yOdo,2));
  Dist2Line(xi, yi, xf, yf, xOdo, yOdo, distLine, nearX, nearY);
  distLine := abs(distLine);
  error_finalrot := NormalizeAngle(tf - thodo);
  alfa := ATan2(yf - yi, xf - xi);

  //Find fastest rotation
  if error_finalrot > 0 then begin
    rotateToFinal := RotateRight;
  end else begin
    rotateToFinal := RotateLeft;
  end;

  //Transitions Linear Vel
  case state_Lin of
    Go_Forward: begin
      if error_dist < TOL_FINDIST then begin
        state_Lin := Stop_Lin;
      end else if error_dist < DIST_DA then begin
        state_Lin := De_Accel_Lin;
      end;
    end;
    De_Accel_Lin: begin
      if error_dist < TOL_FINDIST then begin
        state_Lin := Stop_Lin;
      end else if error_dist > DIST_NEWPOSE  then begin
        state_Lin := Go_Forward;
      end;
    end;
    Stop_Lin: begin
      if error_dist > DIST_NEWPOSE then begin
        state_Lin := Go_Forward;
      end;
    end;
  end;

  //Outputs
  case state_Lin of
    Go_Forward : begin
      VlinX := VEL_LIN_NOM*cos(alfa) + 2*(nearX - xOdo);
      VlinY := VEL_LIN_NOM*sin(alfa) + 2*(nearY - yOdo);
      V := VlinX*cos(thOdo) + VlinY*sin(thOdo);
      Vn := -VlinX*sin(thOdo) + VlinY*cos(thOdo);
      SetRCValue(9,13,'Go_FL');
    end;
    De_Accel_Lin : begin
      VlinX := (VEL_LIN_NOM/3)*cos(alfa) + 2*(nearX - xOdo);
      VlinY := (VEL_LIN_NOM/3)*sin(alfa) + 2*(nearY - yOdo);
      V := VlinX*cos(thOdo) + VlinY*sin(thOdo);
      Vn := -VlinX*sin(thOdo) + VlinY*cos(thOdo);
      SetRCValue(9,13,'DAcc_FL');
    end;
    Stop_Lin : begin
      V := 0;
      Vn := 0;
      SetRCValue(9,13,'StopL_FL');
    end;
  end;

  //Transitions Rotation
  case state_Rot of
    Rotation: begin
      if abs(error_finalrot) < TOL_FINTHETA then begin
        state_Rot := Stop_Rot;
      end else if abs(error_finalrot) < THETA_DA then begin
        state_Rot := De_Accel_Rot;
      end;
    end;
    De_Accel_Rot: begin
      if abs(error_finalrot) < TOL_FINTHETA then begin
        state_Rot := Stop_Rot;
      end else if abs(error_finalrot) > THETA_NEWPOSE  then begin
        state_Rot := Rotation;
      end;
    end;
    Stop_Rot: begin
      if abs(error_finalrot) > THETA_NEWPOSE then begin
        state_Rot := Rotation;
      end;
    end;
  end;

  //Outputs
  case state_Rot of
    Rotation : begin
      W := rotateToFinal;
    end;
    De_Accel_Rot : begin
      W := rotateToFinal/3;
    end;
    Stop_Lin : begin
      W := 0;
    end;
  end;

  MotorVel(V,Vn,W,RC);

  // --------------------------------------------------
  // DEBUG
  // Robot linear and angular velocities
  SetRCValue(14,4,format('%.4g',[V]));
  SetRCValue(15,4,format('%.4g',[Vn]));
  SetRCValue(16,4,format('%.4g',[W]));
  SetRCValue(4,15,format('%.4g',[error_dist]));
  SetRCValue(5,15,format('%.4g',[alfa]));

end;