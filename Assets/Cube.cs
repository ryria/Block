using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Firebase;
using Firebase.Database;
public class Cube : MonoBehaviour
{
    public int m_health;
    public string m_databaseID;
    public Vector3 m_position;
    //m_dbRef.Child("cubes").Child(a_ref).Child("Health").SetValueAsync(a_health);
    public void TakeDamage(int a_damage)
    {
        FirebaseDatabase.DefaultInstance.GetReference("cubes").Child(m_databaseID).Child("Health").GetValueAsync().ContinueWith(task =>
        {
            if (task.IsFaulted)
            {
                Debug.LogError(task);
            }
            else if (task.IsCompleted)
            {
                DataSnapshot snapshot = task.Result;
                int value = int.Parse(snapshot.Value.ToString());
               

                if (value > 0)
                {
                    value -= a_damage;
                    m_health = value;
                    FirebaseDatabase.DefaultInstance.GetReference("cubes").Child(m_databaseID).Child("Health").SetValueAsync(m_health);
                }

                if(value <= 0)
                {
                    FirebaseDatabase.DefaultInstance.GetReference("cubes").Child(m_databaseID).Child("Health").SetValueAsync(m_health);
                    FirebaseDatabase.DefaultInstance.GetReference("cubes").Child(m_databaseID).Child("DestroyedBy").SetValueAsync("Rob");
                }
            }
        });
    }
}
