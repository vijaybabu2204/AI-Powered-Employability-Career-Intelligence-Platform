import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib

df = pd.read_csv("ml/student_placement.csv")

x = df.drop("Placed",axis=1)
y = df["Placed"]

model = RandomForestClassifier()
model.fit(x,y)

joblib.dump(model,"ml/placement_model.pkl")
print("Model trained Successfully")
