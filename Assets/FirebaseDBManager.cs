using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;

using Firebase;
using Firebase.Database;

using UnityEngine.UI;

public class FirebaseDBManager : MonoBehaviour
{

    DatabaseReference m_dbRef;
    public Text scoreText;
    public CubeManager m_cubeManager;
    List<CubeData> m_cubeData;
    bool dataLoaded;

    private void Awake()
    {
        m_dbRef = FirebaseDatabase.DefaultInstance.RootReference;
        m_cubeData = new List<CubeData>();
        StartCoroutine("GenerateFromServer");
        temp();
       

    }
    // Start is called before the first frame update
    void Start()
    {
        
        
    }

    void temp()
    {
       
        FirebaseDatabase.DefaultInstance.GetReference("cubes").GetValueAsync().ContinueWith(task =>
        {
            if (task.IsFaulted)
            {
                Debug.LogError(task);
            }
            else if (task.IsCompleted)
            {
                DataSnapshot snapshot = task.Result;
                foreach (DataSnapshot s in snapshot.Children)
                {
                    CubeData temp;
                    temp.m_health = Int32.Parse(s.Child("Health").Value.ToString());
                    temp.m_id = s.Key.ToString();
                    temp.m_pos = StringToVector3(s.Child("Position").Value.ToString());
                    m_cubeData.Add(temp);


                }
                dataLoaded = true;
               
            }
        });
    }

    IEnumerator GenerateFromServer()
    {
        while (dataLoaded == false)
        {
            yield return null;
        }
        m_cubeManager.GenerateFromServer(m_cubeData);
        FirebaseDatabase.DefaultInstance.GetReference("cubes").ChildChanged += HandleChildUpdate;
    }


    public void UpdateScore()
    {
        FirebaseDatabase.DefaultInstance.GetReference("counter").GetValueAsync().ContinueWith(task =>
        {
            if (task.IsFaulted)
            {
                Debug.LogError(task);
            }
            else if (task.IsCompleted)
            {
                DataSnapshot snapshot = task.Result;
                int value = int.Parse(snapshot.Value.ToString());
                value++;
                m_dbRef.Child("counter").SetValueAsync(value);
            }
        });

    }

    public void AddCubeReference(string a_ref, int a_health, Vector3 a_position)
    {
        m_dbRef.Child("cubes").Child(a_ref).Child("Health").SetValueAsync(a_health);
        m_dbRef.Child("cubes").Child(a_ref).Child("DestroyedBy").SetValueAsync("");
        m_dbRef.Child("cubes").Child(a_ref).Child("Position").SetValueAsync(a_position.ToString());
    }

    public void RemoveCubeReference(string a_ref)
    {
        m_dbRef.Child("cubes").Child(a_ref).RemoveValueAsync();
    }

    public void HandleChildUpdate(object sender, ChildChangedEventArgs args)
    {
        if (args.DatabaseError != null)
        {
            Debug.LogError(args.DatabaseError.Message);
            return;
        }

        if (Int32.Parse(args.Snapshot.Child("Health").Value.ToString()) > 0)
        {
            Debug.Log(args.Snapshot.Key.ToString() + " was edited " + args.Snapshot.Child("Health").Value);
            m_cubeManager.UpdateCube(args.Snapshot.Key.ToString(), Int32.Parse(args.Snapshot.Child("Health").Value.ToString()));
        }
        else
        {
            m_cubeManager.RemoveCube(args.Snapshot.Key.ToString());
        }
    }



    // Update is called once per frame
    void Update()
    {
        
    }


    public Vector3 StringToVector3(string sVector)
    {
        // Remove the parentheses
        if (sVector.StartsWith("(") && sVector.EndsWith(")"))
        {
            sVector = sVector.Substring(1, sVector.Length - 2);
        }

        // split the items
        string[] sArray = sVector.Split(',');

        // store as a Vector3
        Vector3 result = new Vector3(
            float.Parse(sArray[0]),
            float.Parse(sArray[1]),
            float.Parse(sArray[2]));

        return result;
    }
}
